from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from food_tracker import FoodTracker
from allergenanalyzer import AllergenAnalyzer
import google.genai as genai
import os
from dotenv import load_dotenv
import json
import re
from datetime import datetime


# 用于存储聊天历史（生产环境应该用数据库）
chat_history = []

# 加载环境变量
load_dotenv()

app = FastAPI()

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化
tracker = FoodTracker()
analyzer = AllergenAnalyzer()

# # 初始化 Google Gemini
# try:
#     genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
#     ai_model = genai.GenerativeModel('gemini-2.5-flash')  # 使用最新模型
#     print("✅ Google Gemini 2.5 Flash initialized successfully")
# except Exception as e:
#     ai_model = None
#     print(f"⚠️ Warning: AI not configured: {e}")

# 初始化 Google Gemini - 详细调试版本
import google.genai as genai

google_api_key = os.environ.get("GOOGLE_API_KEY")
print(f"🔍 DEBUG: GOOGLE_API_KEY = {google_api_key[:20] if google_api_key else 'None'}...")

try:
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    
    client = genai.Client(api_key=google_api_key)
    ai_model = client
    
    print(f"✅ Google Gemini AI initialized successfully")
    
except Exception as e:
    ai_model = None
    print(f"❌ ERROR: AI initialization failed: {e}")
    import traceback
    traceback.print_exc()

# 数据模型
class MealData(BaseModel):
    foods: list[str]

class SymptomData(BaseModel):
    record_id: int
    symptoms: list[str]

class SmartMealInput(BaseModel):
    text: str
    language: str = "auto"

# 基础路由
# @app.get("/")
# def read_root():
#     return {"message": "AllerTrack API is running! 🎉"}

@app.get("/api/records")
def get_records():
    """获取所有记录"""
    return {"records": tracker.records}

@app.post("/api/meal")
def add_meal(meal: MealData):
    """添加新的meal记录"""
    import datetime
    
    meal_time = datetime.datetime.now()
    new_record = {
        "id": tracker.next_id,
        "date": meal_time.strftime("%Y-%m-%d"),
        "meal_time": meal_time.strftime("%H:%M"),
        "foods": meal.foods,
        "symptoms": []
    }
    
    tracker.records.append(new_record)
    tracker.next_id += 1
    tracker.save_data()
    
    return {"message": "Meal added!", "record": new_record}

@app.post("/api/symptoms")
def add_symptoms(data: SymptomData):
    """给指定记录添加症状"""
    record = tracker.find_record_by_id(data.record_id)
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record["symptoms"] = data.symptoms
    tracker.save_data()
    
    return {"message": "Symptoms added!", "record": record}

@app.get("/api/analysis")
def get_analysis():

    if not tracker.records:
        return {"total_meals": 0, "meals_with_symptoms": 0, "foods_analyzed": 0, "results": [], "known_allergens": []}
    
    clean_records = analyzer.filter_contaminated_records(tracker.records)
    confidence_scores = analyzer.calculate_confidence(clean_records)
    records_with_symptoms = [r for r in tracker.records if r.get('symptoms')]
    sorted_foods = sorted(confidence_scores.items(), key=lambda x: x[1], reverse=True)
    
    results = []
    for food, score in sorted_foods:
        if score > 0:
            risk_level = "High" if score > 0.8 else "Medium" if score > 0.4 else "Low"
            results.append({"food": food, "score": round(score * 100, 1), "risk_level": risk_level})
    
    return {
        "total_meals": len(tracker.records),
        "meals_with_symptoms": len(records_with_symptoms),
        "foods_analyzed": len(confidence_scores),
        "results": results,
        "known_allergens": list(tracker.known_allergens)
    }

@app.get("/api/allergens")
def get_allergens():
    """获取已知过敏原"""
    return {"allergens": list(tracker.known_allergens)}

@app.post("/api/allergens")
def add_allergen(allergen: dict):
    """添加已知过敏原"""
    tracker.known_allergens.add(allergen["name"])
    tracker.save_data()
    return {"message": "Allergen added!", "allergens": list(tracker.known_allergens)}


@app.post("/api/analyze-meal")
async def analyze_meal(input_data: SmartMealInput):
    """
    使用 Google Gemini AI 分析 - 带智能标准化
    """
    if not ai_model:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        prompt = f"""Analyze this meal description and extract STANDARDIZED food information:

"{input_data.text}"

IMPORTANT: Use BASE INGREDIENT NAMES, not specific preparations.
For example:
- "beef patty" → "beef"
- "fried chicken" → "chicken"  
- "grilled shrimp" → "shrimp"
- "peanut butter" → "peanuts"
- "sesame seed bun" → "wheat bread"

Respond with ONLY this JSON:
{{
    "restaurant": "name or null",
    "dishes": ["dish names"],
    "ingredients": ["STANDARDIZED ingredient list using base names"],
    "confidence": 85,
    "language_detected": "en or zh"
}}

Standardization rules:
1. Meats: Use base form (beef, chicken, pork, shrimp, fish, lamb)
2. Vegetables: Use base form (onions not "diced onions", tomatoes not "cherry tomatoes")
3. Grains: wheat bread, rice, pasta, oats
4. Dairy: milk, cheese, yogurt, butter
5. Nuts: peanuts, almonds, cashews, walnuts
6. Sauces: If sauce contains allergen, use the allergen (e.g., "peanut sauce" → "peanuts")

Examples:
Input: "Big Mac at McDonald's"
Output: {{"restaurant": "McDonald's", "dishes": ["Big Mac"], "ingredients": ["beef", "wheat bread", "lettuce", "cheese", "pickles", "onions", "sauce"], "confidence": 95, "language_detected": "en"}}

Input: "chicken teriyaki bowl"
Output: {{"restaurant": null, "dishes": ["chicken teriyaki bowl"], "ingredients": ["chicken", "rice", "teriyaki sauce", "vegetables"], "confidence": 85, "language_detected": "en"}}

Input: "shrimp fried rice"
Output: {{"restaurant": null, "dishes": ["shrimp fried rice"], "ingredients": ["shrimp", "rice", "eggs", "vegetables", "soy sauce", "cooking oil"], "confidence": 80, "language_detected": "en"}}"""

        response = ai_model.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        response_text = response.text.strip()
        
        # 清理和解析 JSON
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            response_json = json.loads(json_match.group())
        else:
            response_json = json.loads(response_text)
        
        if 'ingredients' not in response_json or not response_json['ingredients']:
            raise ValueError("No ingredients found")
        
        response_json.setdefault('restaurant', None)
        response_json.setdefault('dishes', [])
        response_json.setdefault('confidence', 85)
        response_json.setdefault('language_detected', 'en')
        
        print(f"✅ AI Analysis: {len(response_json['ingredients'])} ingredients - {response_json['ingredients']}")
        
        return response_json
        
    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.post("/api/generate-medical-advice")
async def generate_medical_advice(data: dict):
    if not ai_model:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    symptoms = data.get("symptoms", [])
    high_risk_foods = data.get("high_risk_foods", [])
    
    prompt = f"""Based on the following allergy symptoms and suspected foods, provide medical testing recommendations:

Symptoms: {', '.join(symptoms)}
Suspected allergens: {', '.join(high_risk_foods)}

Please recommend:
1. Appropriate allergy tests (IgE, IgG, skin prick test, etc.)
2. Whether symptoms suggest IgE-mediated (immediate) or non-IgE-mediated (delayed) reaction
3. Any urgent precautions needed

Respond in JSON format:
{{
    "reaction_type": "IgE-mediated / Non-IgE-mediated / Mixed",
    "recommended_tests": ["test1", "test2", ...],
    "urgency_level": "low / medium / high",
    "precautions": "advice text"
}}
"""
    
    try:
        response = ai_model.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        response_text = response.text.strip()
        
        # 清理和解析 JSON
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            response_json = json.loads(json_match.group())
        else:
            response_json = json.loads(response_text)
        
        # 确保返回格式正确
        response_json.setdefault('reaction_type', 'Medical Testing Recommendations')
        response_json.setdefault('recommended_tests', [])
        response_json.setdefault('urgency_level', 'medium')
        response_json.setdefault('precautions', '')
        
        return response_json
        
    except Exception as e:
        print(f"❌ Medical advice error: {e}")
        raise HTTPException(status_code=500, detail=f"Medical advice generation failed: {str(e)}")

#1.21
@app.post("/api/predict-cross-reactivity")
async def predict_cross_reactivity():
    """使用 AI 预测交叉过敏反应"""
    if not ai_model:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        # 获取用户的已确认过敏原和高风险食物
        clean_records = analyzer.filter_contaminated_records(tracker.records)
        confidence_scores = analyzer.calculate_confidence(clean_records)
        
        confirmed_allergens = list(tracker.known_allergens)
        high_risk_foods = [food for food, score in confidence_scores.items() 
                          if score > 0.8 and food not in confirmed_allergens]
        
        all_known_allergens = confirmed_allergens + high_risk_foods
        
        if not all_known_allergens:
            return {
                "predictions": [],
                "known_allergens": [],
                "explanation": "No allergen data available for prediction"
            }
        
        # 构建 AI prompt
        prompt = f"""You are an expert allergist specializing in food allergies and cross-reactivity.

Based on the following confirmed allergens that the user has:
{', '.join(all_known_allergens)}

Please predict OTHER foods (that the user has NEVER eaten) that they might be allergic to due to:
1. Cross-reactivity (similar proteins)
2. Same botanical family
3. Similar molecular structures
4. Known medical associations

IMPORTANT RULES:
- Only suggest foods NOT in this list: {', '.join(all_known_allergens)}
- Provide 5-10 predictions maximum
- Focus on scientifically documented cross-reactions
- Include both common and less obvious predictions

Respond in JSON format:
{{
    "predictions": [
        {{
            "food": "avocado",
            "confidence": 85,
            "reason": "Latex-fruit syndrome: bananas and avocados share similar proteins (chitinases)",
            "category": "cross_reactivity",
            "severity": "moderate"
        }}
    ]
}}

Categories: "cross_reactivity", "botanical_family", "molecular_similarity"
Severity: "high", "moderate", "low"
Confidence: 0-100 (how likely based on medical literature)
"""

        response = ai_model.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        response_text = response.text.strip()
        
        # 清理和解析 JSON
        import re
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = json.loads(response_text)
        
        # 确保返回格式正确
        if 'predictions' not in result:
            result = {'predictions': []}
        
        # 添加已知过敏原信息
        result['known_allergens'] = {
            'confirmed': confirmed_allergens,
            'high_risk': high_risk_foods
        }
        
        print(f"✅ AI Prediction: {len(result['predictions'])} foods predicted")
        
        return result
        
    except Exception as e:
        print(f"❌ Cross-reactivity prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/api/predict")
def get_prediction_graph():
    """生成预测图数据(历史数据和ai预测)"""
    try:
        # 获取分析结果
        clean_records = analyzer.filter_contaminated_records(tracker.records)
        confidence_scores = analyzer.calculate_confidence(clean_records)
        
        if not confidence_scores:
            return {
                "nodes": [],
                "edges": [],
                "summary": {
                    "confirmed": len(tracker.known_allergens),
                    "high_risk": 0,
                    "predicted": 0
                },
                "has_data": False
            }
        
        # 分类食物
        confirmed_allergens = tracker.known_allergens
        high_risk_foods = set()
        
        for food, score in confidence_scores.items():
            if food not in confirmed_allergens and score > 0.8:
                high_risk_foods.add(food)
        
        # 构建节点
        nodes = []
        
        # 已确认过敏原（红色大节点）
        for food in confirmed_allergens:
            nodes.append({
                "id": food,
                "label": food,
                "type": "confirmed",
                "score": 100,
                "size": 40
            })
        
        # 高风险食物（橙色节点）
        for food in high_risk_foods:
            score = confidence_scores.get(food, 0) * 100
            nodes.append({
                "id": food,
                "label": food,
                "type": "high_risk",
                "score": round(score, 1),
                "size": 35
            })
        
        # 构建边（食物共现关系）
        edges = []
        edge_set = set()
        
        food_cooccurrence = {}
        for record in clean_records:
            foods = record.get("foods", [])
            has_symptoms = len(record.get("symptoms", [])) > 0
            
            if has_symptoms:
                for i, food1 in enumerate(foods):
                    if food1 not in food_cooccurrence:
                        food_cooccurrence[food1] = {}
                    
                    for food2 in foods[i+1:]:
                        if food2 not in food_cooccurrence:
                            food_cooccurrence[food2] = {}
                        
                        food_cooccurrence[food1][food2] = food_cooccurrence[food1].get(food2, 0) + 1
                        food_cooccurrence[food2][food1] = food_cooccurrence[food2].get(food1, 0) + 1
        
        all_foods = list(confirmed_allergens) + list(high_risk_foods)
        
        for food1 in all_foods:
            for food2 in all_foods:
                if food1 != food2:
                    weight = food_cooccurrence.get(food1, {}).get(food2, 0)
                    if weight > 0:
                        edge_key = tuple(sorted([food1, food2]))
                        if edge_key not in edge_set:
                            edges.append({
                                "source": food1,
                                "target": food2,
                                "weight": weight,
                                "type": "cooccurrence"
                            })
                            edge_set.add(edge_key)
        
        return {
            "nodes": nodes,
            "edges": edges,
            "summary": {
                "confirmed": len(confirmed_allergens),
                "high_risk": len(high_risk_foods),
                "predicted": 0  # AI预测的数量将从另一个接口获取
            },
            "has_data": True
        }
        
    except Exception as e:
        print(f"❌ Prediction graph error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "nodes": [],
            "edges": [],
            "summary": {"confirmed": 0, "high_risk": 0, "predicted": 0},
            "has_data": False
        }

@app.get("/api/chat-history")
def get_chat_history():
    """获取聊天历史"""
    return {"messages": chat_history}

@app.post("/api/chat")
async def chat_with_ai(message: dict):
    """AI 聊天助手 - 基于用户数据回答问题"""
    if not ai_model:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        user_message = message.get("message", "").strip()
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # 保存用户消息到历史
        user_msg = {
            "id": len(chat_history) + 1,
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.append(user_msg)
        
        # 获取用户数据
        clean_records = analyzer.filter_contaminated_records(tracker.records)
        confidence_scores = analyzer.calculate_confidence(clean_records)
        
        # 统计信息
        total_meals = len(tracker.records)
        meals_with_symptoms = len([r for r in tracker.records if r.get('symptoms')])
        confirmed_allergens = list(tracker.known_allergens)
        
        # 获取高风险食物
        high_risk_foods = []
        for food, score in confidence_scores.items():
            if score > 0.8 and food not in confirmed_allergens:
                high_risk_foods.append({"food": food, "score": round(score * 100, 1)})
        
        # 获取最近的症状记录
        recent_symptoms = []
        for record in tracker.records[-10:]:  # 最近10条
            if record.get('symptoms'):
                recent_symptoms.append({
                    "date": record.get('date'),
                    "foods": record.get('foods', []),
                    "symptoms": record.get('symptoms', [])
                })
        
        # 构建上下文 prompt
        context = f"""You are an expert food allergy assistant helping a user manage their food allergies.

USER'S ALLERGY DATA:
- Total meals tracked: {total_meals}
- Meals with symptoms: {meals_with_symptoms}
- Confirmed allergens: {', '.join(confirmed_allergens) if confirmed_allergens else 'None'}
- High risk foods (>80% confidence): {', '.join([f"{item['food']} ({item['score']}%)" for item in high_risk_foods[:5]]) if high_risk_foods else 'None'}

RECENT SYMPTOM EVENTS (last 10):
{chr(10).join([f"- {s['date']}: ate {', '.join(s['foods'])} → symptoms: {', '.join(s['symptoms'])}" for s in recent_symptoms[-5:]]) if recent_symptoms else 'No recent symptoms'}

USER QUESTION: {user_message}

INSTRUCTIONS:
- Answer based on the user's specific data above
- Be helpful, empathetic, and medically accurate
- If the user asks about their data, use the statistics above
- If the user asks "what am I allergic to", list their confirmed allergens and high-risk foods
- If the user asks "what should I avoid", give specific recommendations based on their data
- If the user asks about a specific food, check if it appears in their data
- Always remind users to consult a doctor for medical advice
- Keep responses concise and actionable
- Use natural language, avoid overly technical jargon

Respond in a friendly, conversational tone."""

        # 调用 AI
        response = ai_model.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        ai_response = response.text.strip()  # ← 添加这行!

        # 保存 AI 回复到历史
        ai_msg = {
            "id": len(chat_history) + 1,
            "role": "assistant",
            "content": ai_response,  # 现在正确了
            "timestamp": datetime.now().isoformat()
        }
        chat_history.append(ai_msg)
        
        print(f"✅ AI Chat: User asked, AI responded")
        
        return {
            "message": ai_msg,
            "user_data_summary": {
                "total_meals": total_meals,
                "confirmed_allergens": len(confirmed_allergens),
                "high_risk_foods": len(high_risk_foods)
            }
        }
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.delete("/api/chat-history")
def clear_chat_history():
    """清空聊天历史"""
    global chat_history
    chat_history = []
    return {"message": "Chat history cleared"}


from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

@app.delete("/api/allergens/{allergen_name}")
def delete_allergen(allergen_name: str):
    """删除已知过敏源"""
    if allergen_name in tracker.known_allergens:
        tracker.known_allergens.discard(allergen_name)
        tracker.save_data()
        return {"message": "Allergen deleted!", "allergens": list(tracker.known_allergens)}
    else:
        raise HTTPException(status_code=404, detail="Allergen not found")
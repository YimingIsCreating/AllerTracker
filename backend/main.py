#Fall2025, cs 5001
#Yiming Zhou
#This class is a menu that lets users track their meals, add symptoms, and find food allergies.
from food_tracker import FoodTracker
from allergenanalyzer import AllergenAnalyzer

def main():
    tracker = FoodTracker()
    allergenanalyzer = AllergenAnalyzer()

    print('''
                        -------------------
                        🔧 FUNCTION MENU 
                        -------------------  ''')
    
    print('''
1. 🍜 add meal
2. 🤧 add/modify symptom
3. 📝 modify meal
4. ➕ add known allergen
5. ➖ remove know allergen
6. 📊 generate report
7. 👋 Quit''')

    running = True
    while running == True:
        try:
            print()
            oper = int(input("please choose an operation: "))
            if oper == 1:
                tracker.add_meal()
                
            elif oper == 2:
                tracker.modify_symptoms()
                
            elif oper == 3:
                tracker.modify_meal()
                
            elif oper == 4:
                tracker.add_known_allergen()
                
            elif oper == 5:
                tracker.remove_known_allergen()
                
            elif oper == 6:
                tracker.generate_report()
                
            elif oper == 7:
                print("Bye bye")
                running = False
            else:
                print(" ⚠️ Invalid option, please choose again")
                
        except ValueError:
            print()
            print(" ⚠️ Invalid option, please choose again")
        
if __name__ == "__main__":
    main()


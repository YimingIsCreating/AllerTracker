#Fall2025, cs 5001
#Yiming Zhou
#This is a class that calculates which foods might cause allergies based on symptoms.

class AllergenAnalyzer():
    def __init__(self):
        """Initialize AllergenAnalyzer with default parameters"""
        self.time_window_hours = 12  # Set time window to 12 hours for symptom correlation
        self.min_occurrences = 3  # Minimum number of times a food must appear to be analyzed
    
    def calculate_confidence(self, records):
        """
        Calculate confidence scores for each food based on symptom correlation

        Parameters:
        records (list): List of meal records with foods and symptoms

        Returns:
        dict: Dictionary mapping food names to confidence scores (0-1)
        """
        food_state = {}  # Initialize empty dictionary to track food statistics

        for record in records:  # Loop through all meal records
            for food in record.get("foods", []):  # Loop through foods in current record (default to empty list)
                if food not in food_state:  # Check if this food hasn't been seen before
                    food_state[food] = {"total" : 0, "with_symptoms" : 0}  # Initialize counters for this food
                food_state[food]["total"] += 1  # Increment total count for this food

                if record.get("symptoms", []):  # Check if this record has any symptoms (default to empty list)
                    food_state[food]["with_symptoms"] += 1  # Increment symptom count for this food

        confidence_scores = {}  # Initialize empty dictionary for confidence scores
        for food, state in food_state.items():  # Loop through each food and its statistics
            total = state["total"]  # Get total number of times this food appeared
            with_symptoms = state["with_symptoms"]  # Get number of times this food appeared with symptoms
            if total >= self.min_occurrences:  # Check if food appears enough times to analyze
                if total > 0:  # Check if total is positive (avoid division by zero)
                    base_confidence = with_symptoms / total  # Calculate ratio of symptom occurrences
                else:
                    base_confidence = 0  # Set confidence to 0 if no occurrences
                data_weight = min(total / self.min_occurrences, 1.0)  # Calculate weight based on data amount
                confidence_scores[food] = base_confidence * data_weight  # Calculate final weighted confidence score
        return confidence_scores  # Return dictionary of confidence scores

    def filter_contaminated_records(self, records, max_foods = 10):
        """
        Filter out contaminated or invalid records
        
        Parameters:
        records (list): List of meal records to filter
        max_foods (int): Maximum number of foods allowed per record (default 10)
        verbose (bool): Whether to print filtering statistics (default False)
        
        Returns:
        list: Filtered list of valid records
        """
        filtered_records = []  # Initialize empty list for valid records
        contaminated_count = {  # Initialize dictionary to count different contamination types
            "too_many_foods": 0,  # Counter for records with too many foods
            "no_foods": 0,  # Counter for records with no foods
            "empty_food_names": 0  # Counter for records with empty food names
        }

        for record in records:  # Loop through all records
            foods = record.get("foods", [])  # Get foods list from record (default to empty list)

            if len(foods) == 0:  # Check if record has no foods
                contaminated_count["no_foods"] += 1  # Increment no foods counter

            if len(foods) > max_foods:  # Check if record has too many foods
                contaminated_count["too_many_foods"] += 1  # Increment too many foods counter
                continue  # Skip to next record (don't process this one)
            
            clean_foods = [food.strip() for food in foods if food.strip()]  # Remove whitespace and filter out empty strings
            if len(clean_foods) < len(foods):  # Check if any foods were removed (were empty)
                contaminated_count["empty_food_names"] += 1  # Increment empty food names counter

            if clean_foods:  # Check if there are any valid foods left
                filtered_records.append({**record, "foods": clean_foods})  # Add a cleaned copy, without mutating the original record
            
        total_contaminated = sum(contaminated_count.values())  # Calculate total number of contaminated records
        return filtered_records  # Return list of valid filtered records
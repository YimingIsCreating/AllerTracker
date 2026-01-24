#Fall2025, cs 5001
#Yiming Zhou
#This is a class that manages meal records, symptoms, and known allergens with save/load features.

import datetime  # Import datetime module for handling date and time
import json  # Import json module for saving/loading data
from allergenanalyzer import AllergenAnalyzer  # Import AllergenAnalyzer class

class FoodTracker():

    def __init__(self):
        """Initialize FoodTracker with empty data structures"""
        self.records = []  # Initialize empty list to store meal records
        self.known_allergens = set()  # Initialize empty set to store known allergens
        self.analyzer = AllergenAnalyzer()  # Create an AllergenAnalyzer instance
        self.next_id = 1  # Initialize ID counter starting from 1
        import sys  # Import system module
        # Check if running in unit test environment
        if 'unittest' in sys.modules:        
            self.load_data_silent()  # Load data silently without printing messages
        else:           
            self.load_data()  # Load data with status messages
        
    def add_meal(self):
        """
        Add a new meal record with foods and timestamp
        
        Parameters:
            None (uses self)
        
        Returns:
            list: Updated list of all records
        """
        
        meal_time = datetime.datetime.now()  # Get current date and time
        input_foods = input("Please enter food names, seperate them by ',' :")  # Prompt user to input food names
        foods_list = [f.strip() for f in input_foods.split(',') if f.strip()]  # Split by comma, strip whitespace, filter empty strings

        # Check if user entered any food (list is not empty)
        if not foods_list:
            print(" 💔 No foods entered")  # Print error message
            return  # Exit function early

        new_record = {  # Create a new record dictionary
        "id": self.next_id,  # Assign current ID
        "date": meal_time.strftime("%Y-%m-%d"),  # Format date as YYYY-MM-DD
        "meal_time": meal_time.strftime("%H:%M"),  # Format time as HH:MM
        "foods": foods_list,  # Store list of foods
        "symptoms": []}  # Initialize empty symptoms list

        self.records.append(new_record)  # Add new record to records list
        self.next_id += 1  # Increment ID counter for next record
        self.save_data()  # Save all data to file
        print(f" 🎉 Record added successfully! ID: {new_record['id']}")  # Print success message with ID
        
        return self.records  # Return updated records list

                        
    def find_record_by_id(self, search_id):
        """
        Find a record by its ID number
        
        Parameters:
        search_id (int): The ID number to search for
    
        Returns:
        dict: The record if found, None if not found
        """

        for record in self.records:  # Loop through all records
            # Check if current record's ID matches the search ID
            if record["id"] == search_id:
                return record  # Return the matching record
        print(f" 💔 No records found for this ID")  # Print message if no match found
        return None  # Return None if no record found
         
    def find_record_by_date(self, search_date):
        """
        Find record(s) by date
        
        Parameters:
        search_date (str): Date in format "YYYY-MM-DD" (example: "2025-11-27")
    
        Returns:
        dict: The selected record if found, None if not found or invalid choice
        """

        matching_records = []  # Initialize empty list for matching records
        for record in self.records:  # Loop through all records
            # Check if current record's date matches the search date
            if record["date"] == search_date:
                matching_records.append(record)  # Add matching record to list
        
        # Check if no matching records were found
        if len(matching_records) == 0:
            print(" 💔 No records found for this date")  # Print error message
            return None  # Return None
        
        # Check if only one record was found
        if len(matching_records) == 1:
            print(f"Found record: {matching_records[0]}")  # Print the found record
            return matching_records[0]  # Return the single record
        
        # Check if multiple records were found
        if len(matching_records) >= 1:
            print("Found multiple records:")  # Print header message
            for i, record in enumerate(matching_records):  # Loop through matching records with index
                print(f"{i+1}. ID: {record['id']}, Foods: {record['foods']}")  # Print each record with number
            
            try:
                choice = int(input("Please select one: "))  # Get user's choice as integer
                # Check if user's choice is within valid range
                if 1 <= choice <= len(matching_records):
                    print(f"Found record: {matching_records[choice - 1]}")  # Print selected record
                    return matching_records[choice - 1]  # Return selected record (adjust for 0-indexing)
                else:
                    print("Invalid choice")  # Print error for out of range
                    return None  # Return None
            except ValueError:  # Catch non-integer input
                print("Invalid choice")  # Print error message
                return None  # Return None
                
    def find_record_by_food(self, search_food):
        """
        Find record(s) containing a specific food
        
        Parameters:
        search_food (str): food name to search for
    
        Returns:
        dict: The selected record if found, None if not found or invalid choice
        """
        matching_records = []  # Initialize empty list for matching records
        for record in self.records:  # Loop through all records
            # Check if any food name in the record contains the search food
            if any(search_food.lower() in food.lower() for food in record["foods"]):
                matching_records.append(record)  # Add matching record to list
        
        # Check if no records containing this food were found
        if len(matching_records) == 0:
            print(" 💔 No records found containing this food")  # Print error message
            return None  # Return None
        
        # Check if only one record was found
        if len(matching_records) == 1:
            print(f"Found record: {matching_records[0]}")  # Print the found record
            return matching_records[0]  # Return the single record
        
        # Check if multiple records were found
        if len(matching_records) >= 1:
            print("Found multiple records:")  # Print header message
            for i, record in enumerate(matching_records):  # Loop through matching records with index
                print(f"{i+1}. ID: {record['id']}, Foods: {record['foods']}")  # Print each record with number
            
            try:
                choice = int(input("Please select one: "))  # Get user's choice as integer
                # Check if user's choice is within valid range
                if 1 <= choice <= len(matching_records):
                    print(f"Found record: {matching_records[choice - 1]}")  # Print selected record
                    return matching_records[choice - 1]  # Return selected record (adjust for 0-indexing)
                else:
                    print(" ⚠️ Invalid choice")  # Print error for out of range
                    return None  # Return None
            except ValueError:  # Catch non-integer input
                print(" ⚠️ Invalid choice")  # Print error message
                return None  # Return None
        

    def modify_meal(self):
        """
        Modify the foods in a meal record.
    
        Steps:
        1. Choose search method (ID, date, or food name)
        2. Find the record
        3. Enter new foods
        """

        print('''
You need to choose a record to add symptoms
Enter 1 to search by id
Enter 2 to search by date
Enter 3 to search by food name''')  # Print menu options
        try:
            search_method = int(input("Please enter number: "))  # Get user's choice as integer
        except ValueError:  # Catch non-integer input
            print(" ⚠️ Invalid choice")  # Print error message
            return
        record = None  # Initialize record variable as None
        
        # Check if user chose to search by ID
        if search_method == 1:
            try:
                search_id = int(input("Please enter record ID: "))  # Get ID as integer
                record = self.find_record_by_id(search_id)  # Call find method
            except ValueError:  # Catch non-integer input
                print(" ⚠️ Invalid input")  # Print error message

        # Check if user chose to search by date
        elif search_method == 2:
            date_str = input("Please enter date (YYYY-MM-DD): ")  # Get date string
            try:
                datetime.datetime.strptime(date_str, "%Y-%m-%d")  # Validate date format
                record = self.find_record_by_date(date_str)  # Call find method with date string
            except ValueError:  # Catch invalid date format
                print(" ⚠️ Invalid format")  # Print error message
                return  # Exit function

        # Check if user chose to search by food name
        elif search_method == 3:
            search_food = input("Please enter food name: ")  # Get food name
            record = self.find_record_by_food(search_food)  # Call find method
        
        else:
            print(" ⚠️ Invalid choice")  # Print error for invalid menu choice
        
        # Check if a record was successfully found
        if record:
            new_foods = input("Please enter new food names, seperate them by ',' :")  # Get new foods input
            new_foods_list = new_foods.split(',')  # Split input by comma
            record["foods"] = new_foods_list  # Update foods in the record
            self.save_data()  # Save changes to file
            print(" 🎉 Meal updated successfully!")  # Print success message


    def modify_symptoms(self):
        """
        Add or modify symptoms for a meal record
        
        Steps:
        1. Choose search method (ID, date, or food name)
        2. Find the record
        3. Enter symptoms
        """
        print('''
You need to choose a record to add symptoms
Enter 1 to search by id
Enter 2 to search by date
Enter 3 to search by food name''')  # Print menu options
        try:
            search_method = int(input("Please enter number: "))  # Get user's choice as integer
        except ValueError:  # Catch non-integer input
            print(" ⚠️ Invalid choice")  # Print error message
            return

        record = None  # Initialize record variable as None
        # Check if user chose to search by ID
        if search_method == 1:
            try:
                search_id = int(input("Please enter record ID: "))  # Get ID as integer
                record = self.find_record_by_id(search_id)  # Call find method
            except ValueError:  # Catch non-integer input
                print(" ⚠️ Invalid input")  # Print error message

        # Check if user chose to search by date
        elif search_method == 2:
            date_str = input("Please enter date (YYYY-MM-DD): ")  # Get date string
            try:
                datetime.datetime.strptime(date_str, "%Y-%m-%d")  # Validate date format
                record = self.find_record_by_date(date_str)  # Call find method
            except ValueError:  # Catch invalid date format
                print(" ⚠️ Invalid format")  # Print error message
                return  # Exit function

        # Check if user chose to search by food name
        elif search_method == 3:
            search_food = input("Please enter food name: ")  # Get food name
            record = self.find_record_by_food(search_food)  # Call find method
        
        else:
            print(" ⚠️ Invalid choice")  # Print error for invalid menu choice

        # Check if a record was successfully found
        if record:
            symptoms = input("please input symptoms, seperate them by ',' : ")  # Get symptoms input
            symptoms_list = symptoms.split(',')  # Split input by comma
            record["symptoms"] = symptoms_list  # Update symptoms in the record
            self.save_data()  # Save changes to file
            print(" 🎉 Symptoms updated successfully!")  # Print success message

    def add_known_allergen(self):
        """
        Add a new known allergen to the list
        
        Returns:
        set: Updated set of known allergens
        """
        new_allergen = input("Please enter known allergen, enter one at a time: ")  # Get allergen name
        self.known_allergens.add(new_allergen)  # Add to set (duplicates automatically ignored)
        self.save_data()  # Save changes to file
         
        print(f" 🎉 Allergen added: {new_allergen}")  # Print success message
        return self.known_allergens  # Return updated allergen set
        

    def remove_known_allergen(self):
        """
        Remove a known allergen from the list
        
        Returns:
        set: Updated set of known allergens, or None if list was empty
        """
        # Check if the known allergens list is empty
        if not self.known_allergens:
            print(" 🤷 No known allergens yet")  # Print message
            return  # Exit function
        
        print(f"Current known allergens: {', '.join(self.known_allergens)}")  # Display current allergens
        romove_allergen = input("Please enter allergen to remove, enter one at a time: ")  # Get allergen to remove
        self.known_allergens.discard(romove_allergen)  # Remove from set (no error if not found)
        self.save_data()  # Save changes to file
        print(f"Current known allergens: {', '.join(self.known_allergens)}")  # Display updated allergens
        return self.known_allergens  # Return updated allergen set

    def generate_report(self):
        """
        Generate and display allergen analysis report
        Shows confidence scores for each food based on symptom correlation
        """
        # Check if there are any records
        if not self.records:
            print(" 🤷 No records yet, cannot generate report")  # Print error message
            return  # Exit function
        records_with_symptoms = [r for r in self.records if r.get('symptoms')]  # Filter records that have symptoms
        confidence_scores = self.analyzer.calculate_confidence(self.records)  # Calculate confidence scores
        
        # Check if there's enough data to generate a report
        if not confidence_scores:
            print(" 💔 Not enough data to generate report")  # Print error message
            return  # Exit function

        print(''' 
                    ---------------------------
                    📊 Allergen Analysis Report
                    ---------------------------
        ''')  # Print report header
        print(" 💡 Tip: Add more meal records with symptoms for better analysis!")  # Print tip
        print(" ⏰ For reference only, not medical advice. Consult a doctor if needed")  # Print disclaimer
        print("------------------------------------------------------------------------")  # Print divider
        print(f"Total meals tracked: {len(self.records)}")  # Print total meals count
        print(f"Meals with symptoms: {len(records_with_symptoms)}")  # Print meals with symptoms count
        print(f"Foods analyzed: {len(confidence_scores)}")  # Print number of analyzed foods
        
        sorted_foods = sorted(confidence_scores.items(), key=lambda x: x[1], reverse=True)  # Sort foods by score descending
        
        display = 0  # Initialize counter for displayed foods
        for food, score in sorted_foods:  # Loop through sorted foods
            # Check if score is greater than 0 (filter out foods with no correlation)
            if score > 0:  
                # Check risk level: high risk (>80%)
                if score > 0.8:
                    risk_level = "🔴 High"  # Set high risk label
                # Check risk level: medium risk (>40%)
                elif score > 0.4:
                    risk_level = "🟡 Medium"  # Set medium risk label
                else:
                    risk_level = "🟢 Low"  # Set low risk label
                
                print(f"{food:20s} {score:6.1%}  {risk_level}")  # Print food, score, and risk level
                display += 1  # Increment display counter
        
        # Check if any allergens were displayed
        if display == 0:
            print("No significant allergen detected yet")  # Print message if no allergens found
        
        print("------------------------------------------------------------------------")  # Print divider
        print("Known allergens")  # Print section header
        print(f"{', '.join(sorted(self.known_allergens))}")  # Print sorted known allergens
        print("------------------------------------------------------------------------")  # Print divider


    def save_data(self):
        """
        Save all data (records, allergens, next_id) to JSON file
        """
        data = {  # Create dictionary with all data
            "records": self.records,  # Include all meal records
            "known_allergens": list(self.known_allergens),  # Convert set to list for JSON
            "next_id": self.next_id  # Include next ID counter
        }
        try:
            with open("diet_data.json", "w", encoding="utf-8") as f:  # Open file for writing
                json.dump(data, f, indent=2, ensure_ascii=False)  # Write data as formatted JSON
        except FileNotFoundError as e:  # Catch file not found error
                print(f"❌ File not found: {e}")  # Print error message
        except PermissionError as e:  # Catch permission error
                print(f"❌ No permission: {e}")  # Print error message
        except Exception as e:  # Catch any other error
                print(f"❌ Unknown error: {e}")  # Print error message
            
        
    def load_data(self):
        """
        Load data from JSON file with status messages
        """
        try:
            with open("diet_data.json", "r", encoding="utf-8") as f:  # Open file for reading
                data = json.load(f)  # Parse JSON data
            self.records = data.get("records", [])  # Load records or empty list if not found
            self.known_allergens = set(data.get("known_allergens", []))  # Load allergens as set
            self.next_id = data.get("next_id", 1)  # Load next ID or default to 1

        except FileNotFoundError:  # Catch if file doesn't exist
            print(" ⏰ No previous data found, starting fresh")  # Print info message
        except PermissionError as e:  # Catch permission error
                print(f"❌ No permission: {e}")  # Print error message
        except Exception as e:  # Catch any other error
                print(f"❌ Unknown error: {e}")  # Print error message
    
    def load_data_silent(self):
        """
        Load data from JSON file silently (for unit tests)
        No error messages printed
        """
        try:
            with open("diet_data.json", "r", encoding="utf-8") as f:  # Open file for reading
                data = json.load(f)  # Parse JSON data
            self.records = data.get("records", [])  # Load records or empty list if not found
            self.known_allergens = set(data.get("known_allergens", []))  # Load allergens as set
            self.next_id = data.get("next_id", 1)  # Load next ID or default to 1
        except:  # Catch any error silently
            pass  # Do nothing, just continue
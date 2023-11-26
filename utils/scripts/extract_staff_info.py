import os
import pandas as pd
import json

def extract_staff_info(excel_path):
    df = pd.read_excel(excel_path)
    df.drop("Contact", axis=1, inplace=True)
    staff_info = df.to_dict(orient='records')
    print(json.dumps(staff_info))

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.realpath(__file__))
    file_path = os.path.join(script_dir, "All Records Query1.xlsx")
    extract_staff_info(file_path)
    

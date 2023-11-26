import pdfplumber
import os
import pandas as pd
import sys
import json
import base64
from io import BytesIO

def extract_tables_from_pdf(base64_pdf_data):
    pdf_file_path = BytesIO(base64.b64decode(base64_pdf_data))
    pdf = pdfplumber.open(pdf_file_path)
    tables = []
    for page in pdf.pages:
        table = page.extract_table()
        if table:
            tables.extend(table)
    return tables

def create_dataframe(tables):
    df = pd.DataFrame(tables[1:], columns=tables[0])
    df.drop(columns=['Examiner', 'Course Name'], inplace=True)
    df = df.fillna(method='ffill')
    df.columns = [col.replace('\n', ' ') for col in df.columns]
    return df

def clean_dataframe(df):
    for col in df.columns:
        if col not in ['Venue', 'Course Code']:
            df[col] = df[col].replace('\n', ' ', regex=True)
    df['Venue'] = df['Venue'].replace('\n', ', ', regex=True)
    df['Course Code'] = df['Course Code'].replace('\n', ', ', regex=True)
    df.replace(to_replace=r'\n', value=' ', regex=True, inplace=True)
    df = df[~(df == df.columns).sum(axis=1).gt(1)]
    df['Day/Date'] = df['Day/Date'].str.split(' ', 1).str[1].str.strip().str.strip('/')
    df.rename(columns={'Day/Date': 'Date'}, inplace=True)
    return df

def split_time_column(df):
    time_index = df.columns.get_loc('Time')
    time_df = df['Time'].str.split('-', expand=True)
    time_df.columns = ['Start Time', 'End Time']
    df = df.drop('Time', axis=1)
    df = pd.concat([df.iloc[:, :time_index], time_df, df.iloc[:, time_index:]], axis=1)
    df['Start Time'] = df['Start Time'].str.strip()
    df['End Time'] = df['End Time'].str.strip()
    df['Start Time'] = df.apply(lambda row: row['Start Time'] + row['End Time'][-2:] if 'am' not in row['Start Time'] and 'pm' not in row['Start Time'] else row['Start Time'], axis=1)
    return df

def main():
    base64_pdf_data = sys.stdin.read()
    tables = extract_tables_from_pdf(base64_pdf_data)
    df = create_dataframe(tables)
    df = clean_dataframe(df)
    df = split_time_column(df)
    exams_schedule = df.to_dict(orient='records')
    print(json.dumps(exams_schedule))

if __name__ == "__main__":
    main()
import os
import pdfplumber
import pandas as pd
import numpy as np
import re
import json
import base64
from io import BytesIO
import sys

def extract_tables_from_pdf(base64_pdf_data):
    pdf_file_path = BytesIO(base64.b64decode(base64_pdf_data))
    pdf = pdfplumber.open(pdf_file_path)
    tables = []
    for page in pdf.pages:
        table = page.extract_table()
        if table:
            tables.extend(table)
    return tables

def clean_venue(venue):
    venue = re.sub(r'.*?(?=PG|SMA|SAARAH MENSAH AUD|SAARAH MENSAH AUDITORIUM|BLOCK)', '', venue)
    venue = re.sub(r'\d', '', venue)
    if venue.strip().startswith('BLOCK'):
        venue = 'PG ' + venue
    return venue.strip()

def clean_dataframe(df):
    df.drop(columns=['Course Name'], inplace=True)
    df.replace("", np.nan, inplace=True)
    df = df.fillna(method='ffill')
    df.columns = [col.replace('\n', ' ') for col in df.columns]
    for col in df.columns:
        if col not in ['Venue', 'Course Code']:
            df[col] = df[col].replace('\n', ' ', regex=True)
    df['Venue'] = df['Venue'].replace('\n', ' - ', regex=True)
    df['Venue'] = df['Venue'].apply(clean_venue)
    df['Course Code'] = df['Course Code'].replace('\n', ', ', regex=True)
    df.replace(to_replace=r'\n', value=' ', regex=True, inplace=True)
    df = df[~(df == df.columns).sum(axis=1).gt(1)]
    df['Day/Dat e'] = df['Day/Dat e'].str.split(' ', 1).str[1].str.strip().str.strip('/')
    df.rename(columns={'Day/Dat e': 'Date'}, inplace=True)
    return df

def clean_time(df):
    time_index = df.columns.get_loc('Time')
    df['Time'] = df['Time'].str.replace('–', '-').str.replace(' ', '')
    time_df = df['Time'].str.split('-', expand=True)
    time_df.columns = ['Start Time', 'End Time']
    df = df.drop('Time', axis=1)
    df = pd.concat([df.iloc[:, :time_index], time_df, df.iloc[:, time_index:]], axis=1)
    df['Start Time'] = df['Start Time'].str.strip().str.lower()
    df['End Time'] = df['End Time'].str.strip().str.lower()
    df['Start Time'] = df['Start Time'].apply(lambda x: x if ':' in x else x[:-2] + ':00' + x[-2:])
    df['End Time'] = df['End Time'].apply(lambda x: x if ':' in x else x[:-2] + ':00' + x[-2:])
    return df

def clean_invigilators(df):
    df['Invigilators'] = df['Invigilators'].str.replace(r'(\b\w+\b)(\s[A-Z]\.)', r'\1, \2', regex=True).str.title()
    df['Invigilators'] = df['Invigilators'].str.replace(r'\s*-\s*', '-', regex=True)
    df = df.assign(Invigilators=df['Invigilators'].str.split(pat=',\s*', expand=False)).explode('Invigilators')
    df['Invigilators'] = df['Invigilators'].str.replace(r'[^\w\s.-]', '', regex=True)
    df['Invigilators_sorted'] = df['Invigilators'].apply(lambda x: ''.join(sorted(re.sub(r'[^a-zA-Z]', '', x))))
    df = df.sort_values('Invigilators').drop_duplicates('Invigilators_sorted', keep='last')
    merged_invigilators = []
    for i, invigilator in enumerate(df['Invigilators_sorted']):
        subset_found = False
        for j, other_invigilator in enumerate(df['Invigilators_sorted']):
            if i != j and set(invigilator).issubset(set(other_invigilator)):
                merged_invigilators.append(df['Invigilators'].iloc[j])
                subset_found = True
                break
        if not subset_found:
            merged_invigilators.append(df['Invigilators'].iloc[i])

    df['Invigilators'] = merged_invigilators
    df = df.drop(columns='Invigilators_sorted')
    return df

def group_by_invigilator(df):
    grouped_df = df.groupby('Invigilators').apply(lambda x: x.iloc[:, df.columns != 'Invigilators'].to_dict('records')).reset_index()
    grouped_df.columns = ['Invigilator', 'Details']
    return grouped_df

def main():
    base64_pdf_data = sys.stdin.read()
    tables = extract_tables_from_pdf(base64_pdf_data=base64_pdf_data)
    df = pd.DataFrame(tables[1:], columns=tables[0])
    df = clean_dataframe(df)
    df = clean_time(df)
    df = clean_invigilators(df)
    df = df[df['Invigilators'].str.strip() != '']
    grouped_df = group_by_invigilator(df)
    invigilators_schedule = grouped_df.to_dict(orient='records')
    print(json.dumps(invigilators_schedule))

if __name__ == "__main__":
    main()
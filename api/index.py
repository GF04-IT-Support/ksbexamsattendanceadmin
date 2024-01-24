from flask import Flask, request, jsonify
from flask_cors import CORS
# from invigilators_extractor import invigilators_main
# from exams_schedule_extractor import exams_main

app = Flask(__name__)
CORS(app) 

@app.route('/api/home', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the API"})

# @app.route('/api/extract-invigilators', methods=['POST'])
# def invigilators_api():
#     try:
#         data = request.get_json()
#         base64_pdf_data = data.get('base64_pdf_data')
#         result = invigilators_main(base64_pdf_data)
#         return jsonify(result)
#     except Exception as e:
#         return jsonify({"error": str(e)})

# @app.route('/api/extract-exams-schedule', methods=['POST'])
# def exams_schedule_api():
#     try:
#         data = request.get_json()
#         base64_pdf_data = data.get('base64_pdf_data')
#         result = exams_main(base64_pdf_data)
#         return jsonify(result)
#     except Exception as e:
#         return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=8080)

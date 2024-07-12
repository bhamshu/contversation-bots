from flask import Flask, request
import chromadb

app = Flask(__name__)

chroma_client = chromadb.PersistentClient(path="chroma_data")
collection = chroma_client.get_or_create_collection(name="tweets")

cnt = collection.count()
print(cnt)

@app.route('/', methods=['GET', 'POST', 'PUT', 'DELETE'])
def handle_request():
    if request.method == 'POST':
        data = request.get_json()
        type = data['type']
        if type == 'tweet':
            data = data['data']
            collection.add(documents=[data['tweetText']],ids= str(data['id']))
            return { "status": 200 }
        if type == 'query':
            query = data['query']
            result = collection.query(query_texts=[query], limit=100)
            print(result)
            return { "status": 200, "data": result }
        pass
    if request.method == 'DELETE':
        # Handle DELETE request
        # ...
        pass
    return { "status": 200 }
    # Handle GET request
    # ...

    # Add a tweet to the Chroma DB

if __name__ == '__main__':
    app.run(port=5001)

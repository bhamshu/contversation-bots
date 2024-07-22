from flask import Flask, request
import chromadb
from red import get_random_post

app = Flask(__name__)

chroma_client = chromadb.PersistentClient(path="chroma_data")
collection = chroma_client.get_or_create_collection(name="tweets")

from scipy import spatial
from chromadb.utils import embedding_functions
default_ef = embedding_functions.DefaultEmbeddingFunction()

cnt = collection.count()
print(cnt)

@app.route('/', methods=['GET', 'POST', 'PUT', 'DELETE'])
def handle_request():
    if request.method == 'POST':
        data = request.get_json()
        print(data)
        type = data['type']
        if type == 'insert':
            data = data['data']
            collection.add(documents=[data['text']],ids= str(data['id']))
            return { "status": 200 }
        if type == 'query':
            query = data['query']
            result = collection.query(query_texts=[query], n_results=10)
            print(result)
            return result
        if type == 'check':
            query = data['query']
            ttext = data['text'] 
            em1 = default_ef([ttext])[0]
            em2 = default_ef([query])[0]
            sim = 1 - spatial.distance.cosine(em1, em2)
            # print(sim)
            return { "status": 200, "score": sim }
        if type == 'reddit':
            data = get_random_post()
            return data
        
    return { "status": 200 }
if __name__ == '__main__':
    app.run(port=5001)

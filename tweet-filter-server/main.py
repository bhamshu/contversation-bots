from flask import Flask, request, jsonify
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'),
api_key=os.environ.get('OPENAI_API_KEY'))
import os

# Set up OpenAI API key

app = Flask(__name__)

from flask import Flask, request, jsonify
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'),
api_key=os.environ.get('OPENAI_API_KEY'))
import os

# Set up OpenAI API key

app = Flask(__name__)

@app.route('/filter_tweets', methods=['POST'])
def filter_tweets():
    # Get the tweets and prompt from the request data
    data = request.get_json()
    tweets = data['tweets']
    prompt = data['prompt']

    # Construct the prompt for the OpenAI API
    api_prompt = f"{prompt}\n\nTweets:\n"
    for tweet_id, tweet_text in tweets.items():
        api_prompt += f"Tweet ID {tweet_id}: {tweet_text}\n"
    api_prompt += "\nOutput: List the IDs of the tweets that match the prompt, separated by commas."

    # Call the OpenAI API
    response = client.completions.create(engine='text-davinci-003',
    prompt=api_prompt,
    temperature=0,
    max_tokens=100,
    top_p=1,
    frequency_penalty=0,
    presence_penalty=0)
    output = response.choices[0].text.strip()

    # Parse the output to get the filtered tweet IDs
    if output:
        filtered_tweets = [tweet_id.strip() for tweet_id in output.split(',')]
    else:
        filtered_tweets = []

    # Return the filtered tweet IDs
    return jsonify({'filtered_tweets': filtered_tweets})


def main():
    # Sample tweets and prompt
    tweets = {
        "1": "This is a positive tweet about dogs.",
        "2": "This tweet is negative and talks about cats.",
        "3": "Another positive tweet about dogs."
    }
    prompt = "Identify if the tweet is positive and about dogs."

    # Construct the payload
    payload = {'tweets': tweets, 'prompt': prompt}

    # Call the filter_tweets function directly
    filtered_tweets = filter_tweets().get_json()['filtered_tweets']
    print(f"Filtered tweet IDs: {filtered_tweets}")

if __name__ == '__main__':
    # Run the main function for testing
    # main()
    # Start the Flask server
    app.run(debug=True)

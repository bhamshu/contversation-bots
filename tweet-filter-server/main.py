from flask import Flask, request, jsonify
from openai import OpenAI
import os

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

app = Flask(__name__)

@app.route('/filter_tweets', methods=['POST'])
def filter_tweets():
    # Get the tweets and prompt from the request data
    data = request.get_json()
    tweets = data['tweets']
    criteria  = data['criteria']

    # Construct the prompt for the OpenAI API
    tweets_with_identifiers = f"\n\nTweets:\n"
    for tweet_id, tweet_text in tweets.items():
        tweets_with_identifiers += f"Tweet ID {tweet_id}: {tweet_text}\n"
    tweets_with_identifiers += "\nOutput: List the IDs of the tweets that match the prompt, separated by commas."

    # Call the OpenAI API
    response = client.chat.completions.create(
        model='gpt-3.5-turbo',
        messages=[
            {
            "role": "system",
            "content": f"You will be provided with a list of identifiers and tweets, and your task is to return the comma separated value of the identifiers of the tweets which match these criteria: {criteria}."
            },
            {
            "role": "user",
            "content": f"{tweets_with_identifiers}"
            }
        ],
        temperature=0.7,
        top_p=1
    )
    output = response.data.choices[0].text.strip()

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

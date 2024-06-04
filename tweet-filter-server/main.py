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
            "content": (
                f"You will be provided with a list of identifiers and tweets, "
                f"and your task is to return the comma-separated value of the identifiers of the tweets "
                f"which match these criteria: <{criteria}>. \n\nJust give a comma separated list of ids. "
                f"Don't give any other word like 'Tweet ID' along with the id, just give the original ids."
                f" If there are no tweets matching the criteria, give an empty response."
                f"Here is an example of the format:\n\n"
                f"Input: {{'1': 'happy tweet1', '2': 'tweet2', '3': 'happy tweet3'}}\n"
                f"Criteria: 'contain the word happy'\n"
                f"Output: 1,3\n\n"
                f"Now, process the following tweets:\n{tweets_with_identifiers}"
            )
        },
        {
            "role": "user",
            "content": f"{tweets_with_identifiers}"
        }
    ],
    temperature=0,
    top_p=1)

    output = response.choices[0].message.content

    # Parse the output to get the filtered tweet IDs
    if output:
        filtered_tweets = [tweet_id.strip() for tweet_id in output.split(',')]
    else:
        filtered_tweets = []

    # Return the filtered tweet IDs
    return jsonify({'filtered_tweets': filtered_tweets})


if __name__ == '__main__':
    # Start the Flask server
    app.run(debug=True)

######## Testing
# curl -X POST   -H "Content-Type: application/json"   -d '{
#     "tweets": {
#       "1": "This is a positive tweet about dogs.",
#       "2": "This tweet is negative and talks about cats.",
#       "3": "Another positive tweet about dogs."
#     },
#     "criteria": "Identify if the tweet is positive and about dogs."
#   }'   http://localhost:5000/filter_tweets

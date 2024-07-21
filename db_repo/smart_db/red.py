import datetime
import praw
import random

# Set up the Reddit client
reddit = praw.Reddit(
    client_id='yeFANkhSBiKw_j44IwzVZQ',
    client_secret='cHRjNir44iW0pm_2YYVYUrVkkaBTUg',
    user_agent='conterversationn_bott/0.0.1 (by u/Subject-Run-7128)'
)

def get_random_post():
    # Get the top submissions from the front page
    submissions = list(reddit.front.hot(limit=100))
    
    # Choose a random submission
    submission = random.choice(submissions)
    
    # Extract attributes of the submission
    time = submission.created_utc
    # convert time to human readable format
    time = datetime.datetime.fromtimestamp(time)
    submission_data = {
        'userName': str(submission.author),
        'title': submission.title,
        'timestamp': time,
        'subreddit': str(submission.subreddit),
        'url': submission.shortlink
        
    }
    
    return submission_data

# Example usage
if __name__ == '__main__':
    random_post = get_random_post()
    print(random_post)

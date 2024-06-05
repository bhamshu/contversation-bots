package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
	"github.com/go-rod/rod/lib/launcher"
)

var tweets = make(map[*rod.Element]string, 1)
var tweetsData = make([]string, 1)
var count int = 0

type ScrapedData struct {
	Tweets   map[int]string `json:"tweets"`
	Criteria string         `json:"criteria"`
}

var dataScrapped ScrapedData

func main() {
	u := launcher.New().
		UserDataDir("./cache").
		Headless(false).
		MustLaunch()
	browser := rod.New().ControlURL(u).MustConnect()
	page := browser.MustPage("https://x.com/narendramodi")

	page.MustWaitLoad()

	// loginTwitter(page)
	autoScrollAndScrape(page)

	waitExit()

}

func loginTwitter(page *rod.Page, email string, password string, uname string) {

	page.MustElement("input[name='text']").Input(email)
	page.MustElement("button[class='css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-lrvibr r-ywje51 r-184id4b r-13qz1uu r-2yi16 r-1qi8awa r-3pj75a r-1loqt21 r-o7ynqc r-6416eg r-1ny4l3l']").MustClick()
	page.WaitLoad()

	page.MustElement("input[name='text']").Input(uname)
	page.MustElement("button[data-testid='ocfEnterTextNextButton']").MustClick()
	page.WaitLoad()

	page.MustElement("input[name='password']").Input(password)
	page.MustElement("button[data-testid='LoginForm_Login_Button']").MustClick()
	page.WaitLoad()

	autoScrollAndScrape(page)
	fmt.Println("Logged in!")
}

func autoScrollAndScrape(page *rod.Page) {
	var allTweets = make(map[int]string, 1)
	for i := 0; i < 10; i++ {

		page.Keyboard.Press(input.PageDown)
		page.Keyboard.Press(input.PageDown)
		page.Keyboard.Press(input.PageDown)
		page.Keyboard.Press(input.PageDown)
		page.Keyboard.Press(input.PageDown)
		page.Keyboard.Press(input.PageDown)

		tweetElements := page.MustElements("article[data-testid='tweet']")

		for i, tweetElement := range tweetElements {

			if tweets[tweetElement] != "" {
				continue
			} else {
				tweets[tweetElement] = tweetElement.MustText()
				tweetData := tweetElement.MustElement(("div[data-testid='tweetText']")).MustText()
				allTweets[i+1] = tweetData
				tweetsData = append(tweetsData, tweetData)
				// fmt.Println(tweetData)
				// fmt.Println()
			}

		}

		count += len(tweets)

		time.Sleep(500 * time.Millisecond)

	}
	dataScrapped.Tweets = allTweets
	dataScrapped.Criteria = "which tweets are about technology."
	dataJson, error := json.Marshal(dataScrapped)

	if error != nil {
		log.Fatal("Error in requestbody")
	}
	resp, err := http.Post("http://3.109.112.234/filter_tweets", "application/json", bytes.NewBuffer(dataJson))

	if err != nil {
		log.Fatal(resp)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %s", err)
	}

	fmt.Println("POST response:", string(body))
}

func waitExit() {
	fmt.Println("Press Enter to exit...")
	fmt.Scanln()
	fmt.Println(count)
}

# App Store Connect checklist

## Before submission

- [ ] Host privacy policy URL (upload `public/privacy.html` or use a website)
- [ ] Add support email: support@affirmeaze.app
- [ ] Capture screenshots (6.7" iPhone required): Today, Library, Onboarding, Settings
- [ ] Complete App Privacy questionnaire (no tracking, local data, optional OpenAI if user adds key)
- [ ] TestFlight beta with 2–3 testers
- [ ] Verify notifications on physical device
- [ ] Verify voice on physical device (Samantha / soothing preset)

## Suggested screenshot captions

1. **Today** — "Your daily affirmation, ready to speak"
2. **Library** — "Browse, search, and save affirmations"
3. **Voice** — "Soothing voice with mantra repeats"
4. **Streak** — "Build your daily practice"
5. **Settings** — "Personalize focus, voice, and reminders"

## Reviewer notes

> AffirmEaze is a local-first affirmation app. No account is required. Data is stored on-device in localStorage. Optional OpenAI integration only activates if the user configures their own API key at build time — it is not enabled by default in the App Store build. "Lock App" pauses the session on device; it is not cloud sign-out.

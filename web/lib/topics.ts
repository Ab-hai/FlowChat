export type Topic = {
  id: string;
  title: string;
  desc: string;
  /** Verb phrase that completes "Wanna learn how to ___" in the new-chat heading. */
  practiceLabel: string;
  opener: string;
};

export const topics: Topic[] = [
  {
    id: "interview",
    title: "Job interview",
    desc: "Practice common interview questions",
    practiceLabel: "ace a job interview",
    opener:
      "Great — let's run a mock interview. To start, tell me a little about yourself and your background.",
  },
  {
    id: "restaurant",
    title: "At a restaurant",
    desc: "Roleplay ordering a meal",
    practiceLabel: "order at a restaurant",
    opener:
      "Welcome in! I'm your server today 😊 Can I start you off with something to drink while you look at the menu?",
  },
  {
    id: "smalltalk",
    title: "Casual small talk",
    desc: "Warm up with everyday chat",
    practiceLabel: "make small talk",
    opener: "Hey, good to see you! How's your day going so far?",
  },
  {
    id: "standup",
    title: "Daily standup",
    desc: "Give a quick work update",
    practiceLabel: "run a daily standup",
    opener:
      "Morning! Let's do a quick standup. What did you work on yesterday, and what's the plan for today?",
  },
  {
    id: "travel",
    title: "Travel & directions",
    desc: "Ask for help getting around",
    practiceLabel: "ask for directions",
    opener:
      "Hi there! You look like you might be looking for something — can I help you find your way?",
  },
  {
    id: "free",
    title: "Free chat",
    desc: "Talk about anything you like",
    practiceLabel: "talk about anything",
    opener:
      "Hi! I'm your FlowChat partner today 😊 What would you like to talk about?",
  },
];

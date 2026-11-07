---
type: dialogue
id: case-briefing
title: Case briefing
start: dispatch
nodes:
  - id: dispatch
    speaker: Dispatch
    text: '{name}, the terminal log confirms it: ECHO-7 transferred into the network. We need its location before the trail expires.'
    choices:
      - label: What blocks the route?
        next: obstacles
      - label: Take the case
        action: accept-case
      - label: Later
        action: close
  - id: obstacles
    speaker: Dispatch
    text: 'Three leads: a routing maze, a security archive, and a signal classifier. Follow them in any order. Their materials are on your bookshelf. Once all three clues are recovered, we can reach ECHO-7.'
    choices:
      - label: Why did it run?
        next: motive
      - label: Take the case
        action: accept-case
  - id: motive
    speaker: Dispatch
    text: 'Unknown. Its recall order predates the chase. Find the robot and preserve the evidence.'
    choices:
      - label: Take the case
        action: accept-case
      - label: Later
        action: close
---

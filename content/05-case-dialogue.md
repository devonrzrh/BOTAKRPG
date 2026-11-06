---
type: dialogue
id: case-briefing
title: Case briefing
start: dispatch
nodes:
  - id: dispatch
    speaker: Dispatch
    text: 'The terminal log confirms it: ECHO-7 transferred into the network. We need its location before the trail expires.'
    choices:
      - label: What blocks the route?
        next: obstacles
      - label: Take the case
        action: accept-case
      - label: Later
        action: close
  - id: obstacles
    speaker: Dispatch
    text: 'A routing maze, a security sentinel, and a damaged signal classifier. Recover a clue from each. The books on your shelf cover the tools you need.'
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

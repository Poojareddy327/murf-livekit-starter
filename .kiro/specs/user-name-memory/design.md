# Design Document: User Name Memory Feature

## Overview
This document describes the technical architecture for implementing the User Name Memory feature. The system captures a user's name during welcome, requests save permission, stores it in localStorage, passes it to the agent, and enables the agent to remember and greet the user by name in future sessions.

## System Components

### 1. Frontend Components

#### WelcomeView Enhancement
- Add name input field with label "What's your name?"
- Accept up to 100 characters
- Add "Next" button to proceed after name entry
- Implement Save Confirmation Dialog that appears after name submission
- Dialog shows: "Can we remember your name?" with "Save" and "Don't Save" buttons

#### NameStorage Utility
- Function: `saveUserName(name: string): void`
  - Saves to localStorage with key "finassist_user_name"
  - Shows success toast notification
- Function: `getUserName(): string | null`
  - Retrieves from localStorage
  - Returns null if not found
- Function: `clearUserName(): void`
  - Deletes localStorage entry
  - Shows confirmation

#### ViewControllerContext Extension
- Store retrieved user name in component state
- Pass user name to AgentSessionProvider
- Include name in session context

### 2. Backend Enhancement

#### Agent Context Extension
- Modify token endpoint to accept optional `user_name` parameter
- Pass user_name through LiveKit room metadata or custom context
- Update SYSTEM_PROMPT to reference user_name when available

#### Agent Personality Rules
- When `user_name` is present, greet: "Hello [name]! It's great to hear from you again."
- When user asks "do you remember my name?", respond: "Yes, your name is [name]."
- Keep responses conversational, not mechanical

### 3. Data Flow

```
User enters name in welcome → Save Confirmation Dialog
  ↓
User clicks "Save" → saveUserName() → localStorage "finassist_user_name"
  ↓
User starts call → ViewControllerContext retrieves getUserName()
  ↓
Frontend includes name in connection payload
  ↓
Backend receives name → adds to agent context
  ↓
Agent uses name in responses
```

## Implementation Strategy

### Phase 1: Frontend Storage Layer
1. Create `lib/name-storage.ts` with save/retrieve/clear functions
2. Enhance WelcomeView with name input field
3. Add Save Confirmation Dialog component
4. Integrate into welcome flow

### Phase 2: Frontend Integration
1. Modify ViewControllerContext to manage name state
2. Pass name through session initialization
3. Include name in API request payloads

### Phase 3: Backend Integration
1. Update token endpoint to accept user_name
2. Pass user_name to agent context/metadata
3. Update SYSTEM_PROMPT with conditional greeting logic

## Storage Details

**localStorage Key:** `finassist_user_name`
**Value:** Plain string, max 100 characters
**Persistence:** Across browser sessions, until user clears or selects "Don't Save"

## API Contract

### Frontend → Backend
Include in connection payload:
```json
{
  "userName": "John",
  "callerId": "..."
}
```

### Backend → Agent Context
```
Agent context includes:
- user_name: "John" (or null if not provided)
```

## Edge Cases Handled

1. User enters empty/whitespace name → Validation prevents submission
2. User selects "Don't Save" → No data persisted, no backend transmission
3. User revisits without saved name → Generic greeting, proceed normally
4. User asks "do you remember my name?" when no name saved → Agent responds "I don't have a saved name for you"
5. LocalStorage unavailable → Fall back to no-name flow gracefully

## Security & Privacy

- No encryption needed (localStorage, user's browser only)
- Name only transmitted to backend if user explicitly saved it
- User can clear name anytime via settings/option in UI
- No tracking or third-party transmission

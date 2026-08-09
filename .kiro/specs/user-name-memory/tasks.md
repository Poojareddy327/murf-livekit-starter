# Tasks: User Name Memory Feature

## Task 1: Add Name Input UI to Welcome View
**Status**: not_started
**Type**: implementation
**Priority**: high

**Description**: Add a name input field and save confirmation dialog to the welcome screen. Users should be able to enter their name before starting the call.

**Details**:
- Add text input field to welcome-view.tsx with label "What's your name?"
- Add state management for name input (useState hooks)
- Create a save confirmation dialog component
- Dialog should have "Save" and "Don't Save" buttons
- Show dialog only after name is submitted
- Add basic validation (max 100 chars, trim whitespace)

**Subtasks**:
- [x] Add useState for name input state
- [x] Add text input element to WelcomeView
- [x] Create SaveConfirmationDialog component
- [x] Add event handlers for Save/Don't Save actions
- [x] Add input validation logic

**Acceptance Criteria**:
- Name input field appears in welcome screen
- User can type and submit a name
- Save confirmation dialog appears after name submission
- Dialog has clear "Save" and "Don't Save" buttons

---

## Task 2: Implement localStorage for Name Persistence
**Status**: not_started
**Type**: implementation
**Priority**: high
**Dependencies**: [Task 1]

**Description**: Implement localStorage save/read functionality to persist the user's name across sessions.

**Details**:
- Save name to localStorage with key "finassist_user_name" when user clicks "Save"
- Read saved name from localStorage on app initialization
- Add clear/delete functionality for saved names
- Validate that name exists before using it

**Subtasks**:
- [x] Create utility function to save name to localStorage
- [x] Create utility function to read name from localStorage
- [x] Create utility function to clear name from localStorage
- [x] Add localStorage read on app initialization
- [x] Handle localStorage quota/permission errors

**Acceptance Criteria**:
- Name is saved to localStorage when "Save" is clicked
- Name persists after page reload
- Name can be retrieved and displayed in next session
- Clear/delete functionality works

---

## Task 3: Update Welcome View to Show Saved Name for Returning Users
**Status**: not_started
**Type**: implementation
**Priority**: medium
**Dependencies**: [Task 2]

**Description**: Update the welcome view to detect returning users with saved names and offer to use the existing name or enter a new one.

**Details**:
- Check localStorage for saved name on welcome view load
- If saved name exists, show option to "Use existing name" or "Enter new name"
- Bypass name input if user chooses to use saved name
- Show saved name in confirmation or greeting

**Subtasks**:
- [x] Check for saved name in localStorage on mount
- [x] Add conditional rendering for returning vs new users
- [x] Add "Use saved name" button option
- [x] Add "Enter new name" button option
- [x] Update flow to skip name input if saved name accepted

**Acceptance Criteria**:
- Returning users see their saved name
- Users can choose to use or change their saved name
- New users proceed through name input as normal

---

## Task 4: Pass User Name to Token Request
**Status**: not_started
**Type**: implementation
**Priority**: high
**Dependencies**: [Task 2]

**Description**: Modify the token API request to include the user's name, so it can be passed to the backend and agent.

**Details**:
- Retrieve saved name from localStorage before making token request
- Add userName parameter to token request body
- Update token API route to accept userName parameter
- Include userName in LiveKit token generation (if supported) or in response metadata

**Subtasks**:
- [x] Retrieve userName from localStorage in app.tsx or view-controller.tsx
- [x] Modify token request to include userName
- [x] Update API route handler to accept userName
- [x] Include userName in token response or metadata

**Acceptance Criteria**:
- Token request includes userName when available
- Backend receives userName in token response
- Backend can access userName from token claims or metadata

---

## Task 5: Update Agent to Receive and Use User Name
**Status**: not_started
**Type**: implementation
**Priority**: high
**Dependencies**: [Task 4]

**Description**: Update the agent in backend/src/agent.py to receive the user name and use it in conversations.

**Details**:
- Extract userName from RunContext or agent initialization
- Add userName to agent system context or prompt
- Update SYSTEM_PROMPT to reference user_name field
- Implement logic to handle "do you remember my name?" queries

**Subtasks**:
- [x] Extract userName from incoming context/token
- [x] Add userName field to agent initialization
- [x] Update SYSTEM_PROMPT to include name handling instructions
- [x] Add logic to respond with name when asked
- [x] Test agent can access and use userName

**Acceptance Criteria**:
- Agent receives userName from frontend
- Agent can reference userName in responses
- Agent responds to "do you remember my name?" with the saved name

---

## Task 6: Add Personalized Greeting for Returning Users
**Status**: not_started
**Type**: implementation
**Priority**: medium
**Dependencies**: [Task 5]

**Description**: Update agent greeting logic to include personalized message for users with saved names.

**Details**:
- Check if userName exists in agent context
- Generate personalized greeting using name (e.g., "Hello [name], welcome back!")
- Use generic greeting if no name is available
- Include greeting in first agent response

**Subtasks**:
- [x] Create greeting logic function
- [x] Add conditional for personalized vs generic greeting
- [x] Include greeting in agent's initial response
- [x] Test greeting appears correctly

**Acceptance Criteria**:
- Returning users receive personalized greeting with their name
- New users receive standard greeting
- Greeting is conversational and natural

---

## Task 7: Add Name Management UI (Optional Clear/Edit)
**Status**: not_started
**Type**: implementation
**Priority**: low
**Dependencies**: [Task 2]

**Description**: Add optional UI controls to allow users to view, edit, or clear their saved name.

**Details**:
- Add settings/menu option to manage saved name
- Show current saved name
- Add "Change Name" button
- Add "Clear Name" button with confirmation
- Update localStorage after changes

**Subtasks**:
- [x] Design name management UI component
- [x] Add access point in welcome view or settings menu
- [x] Implement edit name flow
- [x] Implement clear name with confirmation
- [x] Test all name management operations

**Acceptance Criteria**:
- Users can view their saved name
- Users can change their saved name
- Users can clear their saved name with confirmation
- Changes persist in localStorage

---

## Task 8: End-to-End Testing
**Status**: not_started
**Type**: testing
**Priority**: high
**Dependencies**: [Task 1, Task 2, Task 4, Task 5]

**Description**: Complete end-to-end testing of the entire user name memory feature.

**Details**:
- Test new user flow: enter name → save confirmation → localStorage saves
- Test returning user flow: name retrieved from localStorage → greeting uses name
- Test agent response to "do you remember my name?" → agent responds with correct name
- Test name persistence across page reloads
- Test "Don't Save" flow: name not persisted
- Test privacy: no name sent if not saved

**Subtasks**:
- [x] Test new user saves name successfully
- [ ] Test returning user sees saved name
- [ ] Test agent responds to name query correctly
- [ ] Test name persists after reload
- [ ] Test "Don't Save" prevents persistence
- [ ] Test clearing name works

**Acceptance Criteria**:
- All flows work end-to-end
- Name persists and is used correctly by agent
- Privacy respected (no name sent without consent)
- Feature works across sessions

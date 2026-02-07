# **BEKESHER System Architecture Documentation**

**Project Name:** BEKESHER (בְּקֶשֶׁר \- "In Touch")

**Description:** An automated networking and socialization game for new immigrants in Israel, facilitating connections through weekly task-based meetups.

**Current Status:** MVP / Beta (Telegram-based).

**Target Launch:** Purim (March).

## **1\. High-Level Overview (Current MVP)**

The current system is a **No-Code/Low-Code** solution designed for rapid prototyping. It relies on **Telegram** as the frontend, **Make.com** (formerly Integromat) as the API gateway and orchestrator, **Airtable** as the relational database, and **Google Apps Script** for complex algorithmic processing (matching logic).

### **Core Components**

1. **Client Interface:** Telegram Bot (Menu, Notifications, Chat) & Fillout (Forms for intake/feedback).  
2. **Orchestrator:** Make.com (Webhooks, Routers, Logic).  
3. **Database:** Airtable.  
4. **Compute Engine:** Google Apps Script (Weekly matching algorithm).  
5. **Payment Gateway:** PayPlus.

## **2\. Data Schema (Airtable)**

Based on airtable.txt, the database is relational.

### **Primary Tables**

* **Participants (Участники):**  
  * *Key Fields:* Name, Phone, Telegram\_ID, Status (Active/Lead/Pause/Inactive), Age, Region (North/Center/South), Gender, Family Status, Subscription Expiry (Оплачено до), Score (Всего баллов).  
  * *Preferences:* Target Gender, Target Age Range, Interests/Values.  
* **Groups (Группы):**  
  * *Key Fields:* Group ID, Links to Participants (1-4), Status (Active/Pending Feedback/Completed), Season, Weekly Task.  
* **Tasks (Задания):**  
  * *Key Fields:* Title, Description, Type (Activity/Talk/Creative), Difficulty.  
* **Feedback (Обратная связь):**  
  * *Key Fields:* Link to Participant, Link to Group, Rating (1-10), Photos, Text Feedback ("Want to meet again?").  
* **Random Coffee (Random Coffee):**  
  * *Key Fields:* Telegram\_ID, Status (Searching/Found/Expired/Cancelled), Region, Match Link.  
* **Finance (Финансы):**  
  * *Key Fields:* Date, Type (Income/Expense), Category, Amount, Link to Participant/Partner.  
* **Payment Logs (Лог платежей):**  
  * *Key Fields:* Transaction ID, Status (Success/Fail), Amount.  
* **Support Tickets (Вопрос/Ответ):**  
  * *Key Fields:* Message, Status (New/In Progress/Solved), Admin Response.

## **3\. Core Logic & Data Flows**

The system architecture is event-driven, primarily triggered by Telegram webhooks.

### **A. The "Dispatcher" (Entry Point)**

* **Source:** 1\_ Dispatcher\_BEKESHER v2.blueprint.txt  
* **Logic:**  
  1. Receives all Telegram updates via Webhook.  
  2. **Router:** Analyzes Callback Data or Message Text.  
  3. **Routes:**  
     * menu\_profile → Triggers Profile Scenario.  
     * menu\_edit → Triggers Edit Profile Scenario (sends Fillout link).  
     * menu\_help → Triggers Support Scenario.  
     * menu\_payment → Triggers Payment Scenario.  
     * menu\_pause → Triggers Pause/Resume Logic.  
     * menu\_unsubscribe → Triggers Unsubscribe Logic.  
     * Start / Text → Checks registration. If new, sends Welcome/Onboarding.

### **B. Matching Algorithm ( The "Brain")**

* **Source:** main\_script.txt (Google Apps Script) & 4\_Social\_game\_BEKESHER\_Подбор\_пар.blueprint.txt  
* **Trigger:** Scheduled via Make.com (Weekly, typically Sunday).  
* **Logic Steps:**  
  1. **Fetch Data:** Gets active users from Airtable.  
  2. **Filter:** Excludes users already in "Active" groups or on "Pause".  
  3. **History Check:** Loads match history for the last **4 weeks** to prevent repeat pairs.  
  4. **Matching Stages (Waterfall):**  
     * *Stage A (Strict):* Same Region \+ Age Gap ≤ 10 \+ No recent history.  
     * *Stage B (Expanded):* Same Region \+ Age Gap ≤ 15\.  
     * *Stage C (Repeats):* Allow repeats if necessary.  
     * *Stage D (Neighboring Regions):* Connects "North" with "Center", or "Center" with "South". **Never** North \+ South.  
     * *Stage E (Force Majeure):* Random matching to ensure no one is left alone.  
  5. **Execution:** Writes new groups to Airtable table Groups with status "Active".

### **C. Random Coffee (On-Demand Matching)**

* **Source:** BEKESHER Random Coffee.blueprint.txt  
* **Logic:**  
  1. User clicks "Random Coffee".  
  2. System checks Random Coffee table for existing "Searching" records in the same Region (excluding self).  
  3. **If Match Found:** Updates records to "Found", sends contact details to both users via Telegram.  
  4. **If No Match:** Creates a new record with status "Searching" and tells user to wait.  
  5. **Cleanup:** A separate "Cleaner" script (Уборщик\_BEKESHER) runs periodically to cancel requests older than 24 hours.

### **D. Payments & Subscription**

* **Source:** 3\_Social\_game..., 3.1\_Social\_game..., 3.2\_Напоминания...  
* **Flow:**  
  1. User requests payment → Make generates PayPlus link.  
  2. User pays → PayPlus Webhook triggers Make.  
  3. Make updates Airtable:  
     * Sets Status \= "Active".  
     * Updates Paid Until date (Adds 1 month).  
     * Generates a one-time invite link to the closed Telegram Channel.  
  4. **Reminders:** Scheduled job checks Paid Until date. Sends warnings at 3 days, 1 day, and "Today". Kicks user from channel if expired \> 6 days.

## **4\. Visual Architecture Diagram (Mermaid)**

graph TD  
    subgraph Client\_Side  
        TG\[Telegram Bot\]  
        User((User))  
        Fillout\[Fillout Forms\]  
    end

    subgraph Orchestration\_Make  
        Dispatcher\[Dispatcher Scenario\]  
        Match\_Trigger\[Matching Trigger\]  
        Pay\_Flow\[Payment Flow\]  
        RC\_Flow\[Random Coffee Flow\]  
        Support\[Support Flow\]  
    end

    subgraph Backend\_Logic  
        GAS\[Google Apps Script\]  
    end

    subgraph Database  
        AT\[(Airtable)\]  
    end

    subgraph External\_Services  
        PayPlus\[PayPlus Gateway\]  
    end

    %% Interactions  
    User \--\>|Commands/Clicks| TG  
    TG \--\>|Webhook| Dispatcher  
    Dispatcher \--\>|Router| Pay\_Flow  
    Dispatcher \--\>|Router| RC\_Flow  
    Dispatcher \--\>|Router| Support  
      
    User \--\>|Edit Profile/Feedback| Fillout  
    Fillout \--\>|Webhook| AT

    %% Matching  
    Match\_Trigger \--\>|HTTP Request| GAS  
    GAS \--\>|Read Participants| AT  
    GAS \--\>|Write Groups| AT  
      
    %% Payment  
    Pay\_Flow \--\>|Generate Link| PayPlus  
    PayPlus \--\>|Callback| Pay\_Flow  
    Pay\_Flow \--\>|Update Status| AT  
      
    %% Random Coffee  
    RC\_Flow \--\>|Search/Create| AT  
    RC\_Flow \--\>|Notify| TG

    %% Data Sync  
    AT \<--\>|CRUD Operations| Dispatcher

## **5\. Identified Bottlenecks & Risks (From Discussions)**

1. **Scalability/Cost:**  
   * Make.com operation counts are high (20k/month for \~80 users). Scaling to thousands will become prohibitively expensive.  
   * Airtable has row limits and API rate limits.  
2. **Maintenance:**  
   * "Spaghetti Code" in Make: Logic is split across too many scenarios, making debugging difficult.  
   * Lack of Testing: No automated testing environment; changes are tested in production.  
3. **Data Integrity:**  
   * Manual handling of some matching edge cases.  
   * Privacy concerns regarding storing personal data (though deemed necessary for matching).  
4. **User Experience:**  
   * Telegram interface is limited compared to a dedicated Web App.  
   * Onboarding text is heavy and needs editing.

## **6\. Proposed Future Architecture (Roadmap)**

As discussed by the technical team (Andrey/Masha/Yura), the goal is to migrate from the MVP Low-Code stack to a professional Full-Stack solution.

### **Phase 1: Stabilization (Current Week)**

* **Git Integration:** Move Google Scripts to local VS Code environment using clasp or direct Git integration for version control.  
* **Refactoring:** Clean up Make scenarios, consolidating logic where possible.  
* **Testing:** Run the matching algorithm on the test group (65 users) to ensure stability before public launch.

### **Phase 2: Migration (Medium Term)**

* **Backend:** Migrate core logic from Make/Google Script to **Convex** (or Node.js/Python).  
  * *Why?* Real-time updates, lower cost, better typescript support, built-in database, easy scalability.  
* **Frontend:** Develop a **React** application (potentially wrapped as a Telegram Mini App).  
  * *Why?* Better UI for profiles, history, and payment management.  
* **AI Enhancement:**  
  * Use **Vector Embeddings** (AI) for matching users based on semantic similarity of their "About Me" and "Interests" fields (clustering) rather than just strict filters.

### **Phase 3: Gamification & Community**

* **Points System:** formalized logic for earning points (feedback
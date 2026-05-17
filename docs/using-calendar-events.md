---
title: Using Calendar Events
section: understanding-the-difference
description: How to create, view, and manage calendar events and bookings for mentoring sessions. Includes session statuses such as attended, cancelled, late notice cancellation, and mentee no-show.
media:
  src: assets/images/using-calendar-events/split1.png
  alt: Each calendar hour split into top half (on the hour) and bottom half (half past)
  header: Working with calendar events
steps:
  - title: Overview
    body: |
      Before adding events, it is helpful to know that the Salesforce calendar works a little differently from Google Calendar. Some parts may feel less familiar at first, but once you know where to click, it becomes much easier to use. For example:

      - to move an event, you edit the event details rather than dragging and dropping it
      - event status is shown using a small coloured square in the title, rather than changing the colour of the full event
  - title: How to Add a Calendar Event
    body: |
      Each hour in the calendar is split into two sections:

      - click the **top half** if the session starts on the hour
      - click the **bottom half** if the session starts at half past

      This will open a flow where you can enter the event details.
  - title: Event Details
    body: |
      - *Event Name* — This can be anything you choose. We recommend using the mentee's full name so it is easy to find later.
      - *Description* — If you are using Google Meet, you can paste the meeting link here.

      <button type="button" class="aur-copy" data-aur-copy="https://meet.new/" aria-label="Copy Google Meet new-meeting URL: https://meet.new/"><span class="aur-copy__icon" aria-hidden="true"><svg class="aur-copy__icon-default" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg><svg class="aur-copy__icon-done" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span><span class="aur-copy__label"><span class="aur-copy__label-default">Google Meet URL: <code>https://meet.new/</code></span><span class="aur-copy__label-done">Copied</span></span></button>

      - *Type* — You will see a list of event types:
        - **Mentoring & Other Paid Work** — MindJam Mentoring: normal sessions at your hourly rate. Other Paid Work: work that is not mentoring, paid at your hourly rate.
        - **Group Sessions** — Adventure Guild: D&D (Dungeons & Dragons) sessions. Group Session: standard group sessions.
        - **Fixed Rate Meetings (£40)** — Meeting (Charged), Official Meeting, and Report (Charged): formal meetings or reports you can charge for at a fixed rate.
        - **Non-Chargeable / Internal** — Report, Parent/Carer Meeting, and Personal Time: for internal use, initial meetings, or blockers. These are not billed.
        - **Types to Ignore** — BlockJam Counselling, Counselling, Training (may be removed).
  - title: Mentee Field
    body: |
      This field links the event to a specific mentee. When you click into the **Mentee Field** you will see a dropdown of all your mentees. If your mentee does not appear, press **Enter** on your keyboard to open a window with all your mentees. If the event is for a mentoring session or other work connected to a young person, make sure you select the correct mentee here. If no mentee is added, the system will not know who the event is for. If you are creating a Personal Time event or another event not linked to a young person, such as Other Paid Work, you do not need to add a mentee.

      - *Session Group* — If this is a group session, use the **Session Group** field instead of selecting an individual mentee. Only do this if it is a group session event.
      - *Start Time and End Time* — Enter the time the event starts and ends.
  - title: Repeat and Other Fields
    body: |
      - *Repeat* — If the session repeats, you can choose how often: weekly, monthly, yearly. If needed, you can also add an end date for the series. For example, if a session will only run for a set number of weeks, you can set when it should stop.
      - *Related To and System Information* — You can ignore these fields. **Please do not change them.**

      Once everything is complete, click **Save**.
  - title: Important
    body: |
      When an event is created, the system also creates a Service Appointment in the background. This can take up to 40 seconds. If you do not see the Service Appointment straight away, wait a moment and check again.
  - title: After the Event Has Been Created
    body: |
      When you click on a calendar event, you will see some useful links and options.

      - *Service Appointment* — Use this when you need to complete the wrap up, confirm attendance, or update the session status.
      - *Edit or More Details* — Use this when you need to change the time, date, or other event details, or to delete the event.

      If you need to move a session, open the event and edit the start or end date and time. If the change only applies once, choose **this event**. If the change applies to the full repeating series, choose **the series**.
  - title: Deleting an Event
    body: |
      To delete an event, open it and use the **Delete Series** option. Despite the name, this does more than one thing. You will then be asked whether you want to delete:

      - just this event, or
      - this event and the following series

      So even though the button says Delete Series, you can still choose to remove only one event.
    media:
      - src: assets/images/using-calendar-events/create-calendar-event.gif
        alt: Using the Delete Series option to remove an event
  - title: Understanding the Coloured Square
    body: |
      Each calendar event includes a small square in the title. This will automatically update based on the wrap up, or if the session is called. This shows the session's current status.

      **Key:**

      - 🆕 **Draft** — A placeholder for a Parent/Carer meeting added by the assigning team.
      - ⬜ **Scheduled** — A future session that is confirmed but has not yet taken place.
      - ✅ **Completed** — A successful session where the mentee attended and the wrap-up is finished.
      - ❌ **Cancelled** — A session cancelled within the official policy. No charge to the parent/carer.
      - 🆘 **Admin Required** — A wrapped-up session that is missing funding contact details. The MindJam Finance Team will sort this for you.
      - 🟧 **Late Notice Cancellation** — A cancellation outside the official policy. The parent/carer will be charged.
      - 🟨 **Did Not Attend** — The mentee did not show up for the session. The parent/carer will be charged.
    media:
      - src: assets/images/using-calendar-events/open-existing-calendar-event.gif
        alt: Opening an existing calendar event to see the coloured status square
video:
  src: https://www.youtube-nocookie.com/embed/DrtSBTkWnXg?rel=0
  title: Using Calendar Events video
---

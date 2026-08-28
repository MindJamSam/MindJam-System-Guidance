---
title: Understanding the Difference
section: understanding-the-difference
description: Understanding the difference between mentee profiles, calendar events, and service appointments (sessions) in Salesforce.
steps:
  - title: Overview
    body: |
      Three things to understand: a Mentee's Profile, Calendar Events, and Service Appointments.
  - title: 1. A Mentee's Profile
    body: |
      The Mentee Profile is the young person's main record. You can open this by clicking on the young person's name. This is where you can find:

      - personal details
      - funding information
      - games and equipment
      - the original sign-up form

      You may see two different mentee record links in the **My Mentees** list: **Client** and **Assigned Mentee Name**. These are explained in more detail in the [Accessing Your Mentees](../accessing-your-mentees/) section.

      This is for information only. It does not schedule sessions, confirm attendance, or record what happened in a session.
  - title: 2. Calendar Events
    body: |
      A Calendar Event is the session in your calendar. This shows:

      - the date and time
      - who the session is with
      - the type of session

      It is used to organise and manage your schedule. It helps you plan the session, but it does not confirm that the session happened.
    media:
      - src: assets/images/understanding-the-difference/open-calendar-event-view.webm
        alt: Opening a calendar event
  - title: 3. Service Appointments
    body: |
      A Service Appointment is created automatically when a Calendar Event is made. You can open it by clicking a link that starts with **SA**. This is where you:

      - confirm attendance
      - complete the wrap up
      - add session notes
      - update the session status

      This is what records what actually happened. The system uses this for attendance tracking, attendance emails, invoicing, and payment processing.
    media:
      - src: assets/images/understanding-the-difference/open-service-appointment-view.webm
        alt: Opening a service appointment from a link starting with SA
  - title: Simple Way to Remember It
    body: |
      - **A Mentee's Profile** = information about the young person. This includes **Client** for the shared record and **Assigned Mentee Name** for your mentor-specific record and notes
      - **Calendar Events** = the "when" and "who with" of a session
      - **Service Appointments** = what happened in the session
  - title: Key Point
    body: |
      If you need to read about the young person, go to the **Mentee Profile**. If you need to check or move a session, use the **Calendar Event**. If you need to confirm the session took place and complete the wrap up, use the **Service Appointment**.

      <div class="aur-record-guide aur-record-guide--compact" data-aur-record-guide aria-label="Choose the right Salesforce record">
        <div class="aur-record-guide__choices" role="group" aria-label="Choose what you need to do">
          <button class="aur-record-guide__choice" type="button" data-record-choice="client" aria-pressed="true">
            Read general information
          </button>
          <button class="aur-record-guide__choice" type="button" data-record-choice="assigned" aria-pressed="false">
            Find my notes
          </button>
          <button class="aur-record-guide__choice" type="button" data-record-choice="calendar" aria-pressed="false">
            Check or move a session
          </button>
          <button class="aur-record-guide__choice" type="button" data-record-choice="service" aria-pressed="false">
            Confirm what happened
          </button>
        </div>

        <div class="aur-record-guide__answer" aria-live="polite">
          <div class="aur-record-guide__route">
            <span data-record-context>Mentee Profile</span>
            <span aria-hidden="true">-&gt;</span>
            <strong data-record-title>Client</strong>
          </div>
          <p data-record-summary>Use this for shared, general information about the young person.</p>
          <p class="aur-record-guide__note" data-record-note>Your own session notes and history are under Assigned Mentee Name.</p>
        </div>
      </div>
video:
  src: https://www.youtube-nocookie.com/embed/UAxlOz68_mg?rel=0
  title: Understanding the Difference video
---

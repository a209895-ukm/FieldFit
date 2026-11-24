import type { Question } from "./assessment";
/**
 * SAMPLE ONLY: 8 of the client's questions (2 per level, plus Senior open-ended items) so each job level and
 * question format can be demonstrated. The full bank is being prepared separately and is loaded with
 * Administration > Question bank > Import Excel.
 * Questions written by the client in the Question Bank Input Form (Final, 18 Nov 2026), tab "4. Your Questions".
 * Scores are the client's: +1.0 best, 0 acceptable, -0.5 sub-optimal, -1.0 policy breach, -2.0 fraud
 * (stored here x100). Bahasa Malaysia and Mandarin versions are pending translation and client review,
 * so those languages show the English text for now (translated: false).
 * Generated from the workbook; edit in the Question bank screen or re-import the workbook.
 */
export const CLIENT_QUESTIONS: Question[] = [
  {
    "id": "YLM-NUM-E1",
    "cap": 0,
    "prompt": {
      "en": "A provision shop orders 20 cartons of Red Bull (24 cans per carton) at RM60.00 per carton. This month's trade bulletin offers 'Buy 10 cartons, FREE 1 carton' of the same SKU.\n\nHow many cartons do you deliver, and what is the invoice amount?",
      "ms": "A provision shop orders 20 cartons of Red Bull (24 cans per carton) at RM60.00 per carton. This month's trade bulletin offers 'Buy 10 cartons, FREE 1 carton' of the same SKU.\n\nHow many cartons do you deliver, and what is the invoice amount?",
      "zh": "A provision shop orders 20 cartons of Red Bull (24 cans per carton) at RM60.00 per carton. This month's trade bulletin offers 'Buy 10 cartons, FREE 1 carton' of the same SKU.\n\nHow many cartons do you deliver, and what is the invoice amount?"
    },
    "options": {
      "en": [
        "22 cartons, RM1,200.00",
        "20 cartons, RM1,080.00",
        "22 cartons, RM1,320.00",
        "21 cartons, RM1,200.00"
      ],
      "ms": [
        "22 cartons, RM1,200.00",
        "20 cartons, RM1,080.00",
        "22 cartons, RM1,320.00",
        "21 cartons, RM1,200.00"
      ],
      "zh": [
        "22 cartons, RM1,200.00",
        "20 cartons, RM1,080.00",
        "22 cartons, RM1,320.00",
        "21 cartons, RM1,200.00"
      ]
    },
    "points": [
      100,
      0,
      0,
      0
    ],
    "explanation": "Correct: 22 cartons, RM1,200.00. Note: Illustrative price - replace with the actual carton price and current bulletin mechanic.",
    "enabled": true,
    "level": "Entry",
    "format": "single",
    "translated": false,
    "source": "#02 Price List; #03 Trade Bulletin",
    "rubric": null,
    "client": true
  },
  {
    "id": "YLM-NUM-S2",
    "cap": 0,
    "prompt": {
      "en": "A Sub-D holds 3,600 cartons of Red Bull. Average secondary sales are 150 cartons/day. Policy: after each primary delivery, Sub-D stock should be between 14 and 21 days of sales. The next primary delivery arrives in 7 days. Your RSM wants you to push a large primary order to close the month.\n\nCalculate the current stock holding days and the maximum order you can place for the next delivery within policy. What do you recommend to the RSM, and why?",
      "ms": "A Sub-D holds 3,600 cartons of Red Bull. Average secondary sales are 150 cartons/day. Policy: after each primary delivery, Sub-D stock should be between 14 and 21 days of sales. The next primary delivery arrives in 7 days. Your RSM wants you to push a large primary order to close the month.\n\nCalculate the current stock holding days and the maximum order you can place for the next delivery within policy. What do you recommend to the RSM, and why?",
      "zh": "A Sub-D holds 3,600 cartons of Red Bull. Average secondary sales are 150 cartons/day. Policy: after each primary delivery, Sub-D stock should be between 14 and 21 days of sales. The next primary delivery arrives in 7 days. Your RSM wants you to push a large primary order to close the month.\n\nCalculate the current stock holding days and the maximum order you can place for the next delivery within policy. What do you recommend to the RSM, and why?"
    },
    "options": {
      "en": [],
      "ms": [],
      "zh": []
    },
    "points": [],
    "explanation": "Rubric (Full / Partial / No credit): Full: current SHD = 3,600/150 = 24 days (above the 21-day ceiling); stock on arrival = 3,600 - 7x150 = 2,550 cartons = 17 days; max order = 21x150 - 2,550 = 600 cartons (no minimum needed - already above 14 days). Recommends not loading the Sub-D: freshness/expiry risk (FEFO), ties up Sub-D cash, risk of discounting or dumping; instead drives secondary sales (trade programme, active outlets) and explains this to the RSM with data.\nPartial: correct numbers but weak recommendation, or good reasoning with a calculation error.\nNo credit: agrees to push a large order without analysis. Note: Deck p60/p64: minimum stock holding days, freshness.",
    "enabled": true,
    "level": "Senior",
    "format": "open",
    "translated": false,
    "source": "#05 Stock Count Report (Sub-D)",
    "rubric": "Full: current SHD = 3,600/150 = 24 days (above the 21-day ceiling); stock on arrival = 3,600 - 7x150 = 2,550 cartons = 17 days; max order = 21x150 - 2,550 = 600 cartons (no minimum needed - already above 14 days). Recommends not loading the Sub-D: freshness/expiry risk (FEFO), ties up Sub-D cash, risk of discounting or dumping; instead drives secondary sales (trade programme, active outlets) and explains this to the RSM with data.\nPartial: correct numbers but weak recommendation, or good reasoning with a calculation error.\nNo credit: agrees to push a large order without analysis.",
    "client": true
  },
  {
    "id": "YLM-LOG-S1",
    "cap": 1,
    "prompt": {
      "en": "After outlet verification, a route's outlets in plan dropped from 600 to 400. Hit rate rose from 15% to 22%. Buying outlets went from 90 to 88. Sales value is about the same.\n\nWhich conclusion is correct?",
      "ms": "After outlet verification, a route's outlets in plan dropped from 600 to 400. Hit rate rose from 15% to 22%. Buying outlets went from 90 to 88. Sales value is about the same.\n\nWhich conclusion is correct?",
      "zh": "After outlet verification, a route's outlets in plan dropped from 600 to 400. Hit rate rose from 15% to 22%. Buying outlets went from 90 to 88. Sales value is about the same.\n\nWhich conclusion is correct?"
    },
    "options": {
      "en": [
        "Hit rate improved mainly because non-buying outlets were removed from the plan; DSRs are not yet converting more outlets",
        "DSRs are converting more outlets - their selling skills have improved",
        "Sales will fall by a third next month because a third of outlets were removed",
        "Route effectiveness has worsened"
      ],
      "ms": [
        "Hit rate improved mainly because non-buying outlets were removed from the plan; DSRs are not yet converting more outlets",
        "DSRs are converting more outlets - their selling skills have improved",
        "Sales will fall by a third next month because a third of outlets were removed",
        "Route effectiveness has worsened"
      ],
      "zh": [
        "Hit rate improved mainly because non-buying outlets were removed from the plan; DSRs are not yet converting more outlets",
        "DSRs are converting more outlets - their selling skills have improved",
        "Sales will fall by a third next month because a third of outlets were removed",
        "Route effectiveness has worsened"
      ]
    },
    "points": [
      100,
      0,
      0,
      0
    ],
    "explanation": "Correct: Hit rate improved mainly because non-buying outlets were removed from the plan; DSRs are not yet converting more outlets. Note: Deck p11-12: outlet verification, hit-rate analysis for route optimisation.",
    "enabled": true,
    "level": "Senior",
    "format": "single",
    "translated": false,
    "source": "#08 Sales Dashboard; #09 Visitation Report",
    "rubric": null,
    "client": true
  },
  {
    "id": "YLM-LOG-S2",
    "cap": 1,
    "prompt": {
      "en": "In one area over 2 months: two of six DSRs resigned; % visitation fell from 85% to 60%; secondary sales fell 15%; primary sales to the Sub-D stayed flat; Sub-D stock holding days rose from 14 to 30.\n\nExplain how these facts are connected and what the real problem is. What would you do first?",
      "ms": "In one area over 2 months: two of six DSRs resigned; % visitation fell from 85% to 60%; secondary sales fell 15%; primary sales to the Sub-D stayed flat; Sub-D stock holding days rose from 14 to 30.\n\nExplain how these facts are connected and what the real problem is. What would you do first?",
      "zh": "In one area over 2 months: two of six DSRs resigned; % visitation fell from 85% to 60%; secondary sales fell 15%; primary sales to the Sub-D stayed flat; Sub-D stock holding days rose from 14 to 30.\n\nExplain how these facts are connected and what the real problem is. What would you do first?"
    },
    "options": {
      "en": [],
      "ms": [],
      "zh": []
    },
    "points": [],
    "explanation": "Rubric (Full / Partial / No credit): Full: links the chain - resignations -> uncovered routes -> visitation drop -> secondary sales drop -> primary still pushed -> stock builds at Sub-D (30 days) -> freshness risk and Sub-D cash tied up -> future orders will fall. Root cause = coverage gap, not demand. First actions: roving team / temporary cover on priority outlets, backfill with HR, cut primary loading until SHD normalises, check aged stock (FEFO).\nPartial: some links but treats symptoms separately.\nNo credit: blames market demand or the Sub-D without using the data. Note: Links to RTS JD (cover absent RTMs) and deck p60.",
    "enabled": true,
    "level": "Senior",
    "format": "open",
    "translated": false,
    "source": "#05 Stock Count Report; #08 Sales Dashboard",
    "rubric": "Full: links the chain - resignations -> uncovered routes -> visitation drop -> secondary sales drop -> primary still pushed -> stock builds at Sub-D (30 days) -> freshness risk and Sub-D cash tied up -> future orders will fall. Root cause = coverage gap, not demand. First actions: roving team / temporary cover on priority outlets, backfill with HR, cut primary loading until SHD normalises, check aged stock (FEFO).\nPartial: some links but treats symptoms separately.\nNo credit: blames market demand or the Sub-D without using the data.",
    "client": true
  },
  {
    "id": "YLM-SJT-E2",
    "cap": 2,
    "prompt": {
      "en": "A shop owner offers you RM50 'duit kopi' if you give him this month's trade bulletin free goods, even though his order is below the minimum quantity.\n\nWhat do you do?",
      "ms": "A shop owner offers you RM50 'duit kopi' if you give him this month's trade bulletin free goods, even though his order is below the minimum quantity.\n\nWhat do you do?",
      "zh": "A shop owner offers you RM50 'duit kopi' if you give him this month's trade bulletin free goods, even though his order is below the minimum quantity.\n\nWhat do you do?"
    },
    "options": {
      "en": [
        "Accept the money and give the free goods - it is a small amount",
        "Politely decline, explain the promotion terms and show him how he can qualify (e.g. top up the order to the minimum)",
        "Decline, refuse to serve the shop again and report the owner",
        "Decline the money but give the free goods anyway to keep him happy"
      ],
      "ms": [
        "Accept the money and give the free goods - it is a small amount",
        "Politely decline, explain the promotion terms and show him how he can qualify (e.g. top up the order to the minimum)",
        "Decline, refuse to serve the shop again and report the owner",
        "Decline the money but give the free goods anyway to keep him happy"
      ],
      "zh": [
        "Accept the money and give the free goods - it is a small amount",
        "Politely decline, explain the promotion terms and show him how he can qualify (e.g. top up the order to the minimum)",
        "Decline, refuse to serve the shop again and report the owner",
        "Decline the money but give the free goods anyway to keep him happy"
      ]
    },
    "points": [
      -200,
      100,
      -50,
      -100
    ],
    "explanation": "Weighted judgement: A -2.0; B +1.0; C -0.5; D -1.0. Note: -2.0 for bribery and misuse of trade programme.",
    "enabled": true,
    "level": "Entry",
    "format": "weighted",
    "translated": false,
    "source": "#03 Trade Bulletin; #11 SOP / code of conduct",
    "rubric": null,
    "client": true
  },
  {
    "id": "YLM-SJT-S2",
    "cap": 2,
    "prompt": {
      "en": "The area manager of a mini-market chain complains that our merchandisers leave the store room messy, chiller price labels do not match the products, and expired Red Bull is not being returned. He threatens to stop allowing our merchandisers into his stores.\n\nHow would you handle this in the first week, and longer term?",
      "ms": "The area manager of a mini-market chain complains that our merchandisers leave the store room messy, chiller price labels do not match the products, and expired Red Bull is not being returned. He threatens to stop allowing our merchandisers into his stores.\n\nHow would you handle this in the first week, and longer term?",
      "zh": "The area manager of a mini-market chain complains that our merchandisers leave the store room messy, chiller price labels do not match the products, and expired Red Bull is not being returned. He threatens to stop allowing our merchandisers into his stores.\n\nHow would you handle this in the first week, and longer term?"
    },
    "options": {
      "en": [],
      "ms": [],
      "zh": []
    },
    "points": [],
    "explanation": "Rubric (Full / Partial / No credit): Full: responds fast and respectfully (meet, listen, no excuses); verifies facts with store visits/photos; immediate fixes (tidy our store-room area, correct price labels, process expired returns per SOP); root cause (FEFO practice, order quantity for slow SKUs, visit frequency, return process); OJT for merchandisers with a checklist; agrees standards and a review date with the chain; follows up and reports to Senior KAM.\nPartial: fixes symptoms only or no follow-up.\nNo credit: defends the team, blames store staff, or offers unauthorised compensation. Note: Deck p36-37 (KK Mart). Suited to Roving Team Supervisor / ASM.",
    "enabled": true,
    "level": "Senior",
    "format": "open",
    "translated": false,
    "source": "#04 Planogram; #11 SOPs",
    "rubric": "Full: responds fast and respectfully (meet, listen, no excuses); verifies facts with store visits/photos; immediate fixes (tidy our store-room area, correct price labels, process expired returns per SOP); root cause (FEFO practice, order quantity for slow SKUs, visit frequency, return process); OJT for merchandisers with a checklist; agrees standards and a review date with the chain; follows up and reports to Senior KAM.\nPartial: fixes symptoms only or no follow-up.\nNo credit: defends the team, blames store staff, or offers unauthorised compensation.",
    "client": true
  },
  {
    "id": "YLM-SLR-J1",
    "cap": 4,
    "prompt": {
      "en": "Two days before month-end you are at 96% of target. The Sub-D offers to buy extra stock now if you give him next month's promotion early. It has not been approved.\n\nWhat do you do?",
      "ms": "Two days before month-end you are at 96% of target. The Sub-D offers to buy extra stock now if you give him next month's promotion early. It has not been approved.\n\nWhat do you do?",
      "zh": "Two days before month-end you are at 96% of target. The Sub-D offers to buy extra stock now if you give him next month's promotion early. It has not been approved.\n\nWhat do you do?"
    },
    "options": {
      "en": [
        "Agree - it is only two days early",
        "Record the Sub-D's next-month orders as this month's sales in your report",
        "Decline, and close the gap through approved actions (focus outlets, active-outlet drive)",
        "Accept 96% and relax until next month"
      ],
      "ms": [
        "Agree - it is only two days early",
        "Record the Sub-D's next-month orders as this month's sales in your report",
        "Decline, and close the gap through approved actions (focus outlets, active-outlet drive)",
        "Accept 96% and relax until next month"
      ],
      "zh": [
        "Agree - it is only two days early",
        "Record the Sub-D's next-month orders as this month's sales in your report",
        "Decline, and close the gap through approved actions (focus outlets, active-outlet drive)",
        "Accept 96% and relax until next month"
      ]
    },
    "points": [
      -100,
      -200,
      100,
      -50
    ],
    "explanation": "Weighted judgement: A -1.0; B -2.0; C +1.0; D -0.5. Note: Trade-spend compliance.",
    "enabled": true,
    "level": "Junior",
    "format": "weighted",
    "translated": false,
    "source": "#03 Trade Bulletin; #12 Incentive scheme",
    "rubric": null,
    "client": true
  },
  {
    "id": "YLM-DDL-J2",
    "cap": 5,
    "prompt": {
      "en": "Outlet sales (RM) for Feb / Mar / Apr:\nOutlet 1: 219 / 0 / 48\nOutlet 2: 1,866 / 2,395 / 1,671\nOutlet 3: 368 / 0 / 0\nOutlet 4: 0 / 0 / 0\n'At-risk' = bought in Feb but nothing in both Mar and Apr.\n\nWhich outlet(s) are 'at-risk'?",
      "ms": "Outlet sales (RM) for Feb / Mar / Apr:\nOutlet 1: 219 / 0 / 48\nOutlet 2: 1,866 / 2,395 / 1,671\nOutlet 3: 368 / 0 / 0\nOutlet 4: 0 / 0 / 0\n'At-risk' = bought in Feb but nothing in both Mar and Apr.\n\nWhich outlet(s) are 'at-risk'?",
      "zh": "Outlet sales (RM) for Feb / Mar / Apr:\nOutlet 1: 219 / 0 / 48\nOutlet 2: 1,866 / 2,395 / 1,671\nOutlet 3: 368 / 0 / 0\nOutlet 4: 0 / 0 / 0\n'At-risk' = bought in Feb but nothing in both Mar and Apr.\n\nWhich outlet(s) are 'at-risk'?"
    },
    "options": {
      "en": [
        "Outlet 3 only",
        "Outlets 3 and 4",
        "Outlets 1 and 3",
        "Outlets 1, 3 and 4"
      ],
      "ms": [
        "Outlet 3 only",
        "Outlets 3 and 4",
        "Outlets 1 and 3",
        "Outlets 1, 3 and 4"
      ],
      "zh": [
        "Outlet 3 only",
        "Outlets 3 and 4",
        "Outlets 1 and 3",
        "Outlets 1, 3 and 4"
      ]
    },
    "points": [
      100,
      0,
      0,
      0
    ],
    "explanation": "Correct: Outlet 3 only. Note: Based on the outlet sales layout (deck p55).",
    "enabled": true,
    "level": "Junior",
    "format": "single",
    "translated": false,
    "source": "#06 Route Plan (outlet list with sales history)",
    "rubric": null,
    "client": true
  }
];

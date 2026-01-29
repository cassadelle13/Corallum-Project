# 🗺 Corallum Studio: Interactive Elements Map

This document provides the exact file locations and line numbers for all buttons and interactive elements in Corallum Studio. Use this to guide Cursor AI for precise UI/UX modifications.

---

## 1. Global Navigation (Left Sidebar)
**File:** `src/components/GlobalSidebar.tsx`

| Element | Line(s) | Description |
| :--- | :--- | :--- |
| **Search Input** | 59-64 | Global search field for the workspace. |
| **Ask AI Trigger** | 67-71 | "Ask AI" button with Ctrl+L shortcut. |
| **Main Nav Tabs** | 77-85 | Home, Runs, Variables, Resources, Assets, Tutorials. |
| **Triggers Nav** | 91-99 | Schedules and other trigger-related tabs. |
| **Add Trigger (+)** | 100-102 | Plus button to add new triggers. |
| **Footer Nav** | 108-116 | User, Settings, Workers, Folders, Logs. |

---

## 2. Home Dashboard
**File:** `src/components/HomeView.tsx`

| Element | Line(s) | Description |
| :--- | :--- | :--- |
| **+ Script Button** | 39-43 | Button to create a new script. |
| **+ Flow Button** | 44-48 | Primary button to enter the Flow Editor. |
| **+ App Button** | 49-53 | Button to create a new application. |
| **Workspace/Hub Tabs** | 60-61 | Toggle between local workspace and community hub. |
| **Filter Buttons** | 66-69 | All, Scripts, Flows, Apps filters. |
| **Search Bar** | 74-80 | Search input for the items list. |
| **Content Button** | 82 | Secondary action button in filters row. |
| **Edit Button** | 96-98 | Edit button for each item in the list. |
| **More Actions** | 99 | Vertical dots menu for each item. |

---

## 3. Flow Editor Toolbar (Top Bar)
**File:** `src/components/Toolbar.tsx`

| Element | Line(s) | Description |
| :--- | :--- | :--- |
| **Menu Toggle** | 61-63 | Hamburger button to toggle the node library. |
| **Save Draft** | 71-74 | Button to save current progress. |
| **Export** | 76-79 | Button to download the workflow as JSON. |
| **Test Run** | 81-84 | Primary button to execute the workflow. |
| **Deploy** | 86-93 | Success-styled button to deploy to production. |

---

## 4. Component Library (Node Sidebar)
**File:** `src/components/Sidebar.tsx`

| Element | Line(s) | Description |
| :--- | :--- | :--- |
| **Search Input** | 215-222 | Search field to filter available nodes. |
| **Category Headers** | 232-242 | Expandable headers (Triggers, Operators, etc.). |
| **Node Items** | 249-269 | Individual nodes (Webhook, Script, etc.) - clickable & draggable. |
| **Import from Hub** | 280-283 | Footer button to browse more components. |

---

## 5. Node Configuration (Right Panel)
**File:** `src/components/NodeEditor.tsx`

| Element | Line(s) | Description |
| :--- | :--- | :--- |
| **Close Button** | 108-110 | 'X' button to close the editor panel. |
| **Tab Nav (Code/Inputs/Settings)** | 115-135 | Toggle between different configuration views. |
| **Language Select** | 143-160 | Dropdown to change the programming language. |
| **Insert Boilerplate** | 167-173 | Button to reset code to default template. |
| **Monaco Editor** | 176-193 | The main code editor component. |
| **Copy Input Ref** | 217-224 | Button to copy `{{nodes.id.output}}` to clipboard. |
| **Delete Node** | 283-285 | Danger-styled button to remove the node. |
| **Cancel Button** | 287 | Secondary button to discard changes. |
| **Save Changes** | 288-291 | Primary button to apply node updates. |

---

## 🎨 Styling Reference
- **Main CSS:** `src/App.css` (Layout and base styles)
- **Futuristic Theme:** `src/Futuristic.css` (Glassmorphism, Neon, Animations)
- **Global Variables:** Top of `src/Futuristic.css` (Colors, Blur, Glow)

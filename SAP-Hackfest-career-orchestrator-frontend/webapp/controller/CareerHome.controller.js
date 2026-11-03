sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageStrip",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/SearchField",
    "sap/m/CheckBox",
    "sap/m/GroupHeaderListItem",
    "sap/m/Title",
    "sap/m/ProgressIndicator"
], function (
    Controller, MessageToast, MessageStrip, MessageBox, JSONModel,
    Dialog, Button, Text, VBox, HBox, Label, Input,
    TextArea, List, StandardListItem, SearchField,
    CheckBox, GroupHeaderListItem, Title, ProgressIndicator
) {
    "use strict";

    return Controller.extend(
        "com.careerorchestrator.careerorchestrator.controller.CareerHome",
        {
            onInit: function () {
                var oUserModel = new JSONModel({
                    name: "Your Name",
                    email: "",
                    experience: "",
                    currentRole: "Administrative Coordinator",
                    skills: [],
                    workExperience: "",
                    targetRole: "",
                    profileID: "",
                    completedActivities: [],
                    learningProgress: 0
                });

                this.getView().setModel(oUserModel, "user");
                this._oActiveDialog = null;
                this._loadSavedProfile();
            },

            // -------------------------------------------------
            // LOGIN AND SIGN UP
            // -------------------------------------------------

            onShowSignup: function () {
                this.byId("loginSection").setVisible(false);
                this.byId("signupSection").setVisible(true);
                this.byId("loginTab").removeStyleClass("activeTab");
                this.byId("signupTab").addStyleClass("activeTab");
            },

            onShowLogin: function () {
                this.byId("signupSection").setVisible(false);
                this.byId("loginSection").setVisible(true);
                this.byId("signupTab").removeStyleClass("activeTab");
                this.byId("loginTab").addStyleClass("activeTab");
            },

            onSignIn: function () {
                var sEmail = this.byId("emailInput").getValue().trim();
                var sPassword = this.byId("passwordInput").getValue();

                if (!sEmail || !sPassword) {
                    MessageBox.warning("Please enter your email and password.");
                    return;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
                    MessageBox.warning("Please enter a valid email address.");
                    return;
                }

                var sName = sEmail.split("@")[0]
                    .replace(/[._-]+/g, " ")
                    .replace(/\b\w/g, function (c) {
                        return c.toUpperCase();
                    });

                this.getView().getModel("user").setProperty("/name", sName);
                this.getView().getModel("user").setProperty("/email", sEmail);

                MessageToast.show("Demo login successful. Welcome, " + sName + "!");
            },

            onSignUp: function () {
                var sName = this.byId("nameInput").getValue().trim();
                var sEmail = this.byId("signupEmailInput").getValue().trim();
                var sPassword = this.byId("signupPasswordInput").getValue();
                var sConfirm = this.byId("confirmPasswordInput").getValue();

                if (!sName || !sEmail || !sPassword || !sConfirm) {
                    MessageBox.warning("Please fill in all fields.");
                    return;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
                    MessageBox.warning("Please enter a valid email address.");
                    return;
                }

                if (sPassword.length < 8) {
                    MessageBox.warning("Password must contain at least 8 characters.");
                    return;
                }

                if (sPassword !== sConfirm) {
                    MessageBox.error("Passwords do not match.");
                    return;
                }

                this.getView().getModel("user").setProperty("/name", sName);
                this.getView().getModel("user").setProperty("/email", sEmail);

                MessageBox.success(
                    "Your demo profile is ready, " + sName +
                    ". Backend account registration is not connected yet.",
                    { onClose: this.onShowLogin.bind(this) }
                );
            },

            onForgotPassword: function () {
                MessageBox.information(
                    "Password recovery will be available after backend authentication is connected. For this prototype, use Sign Up to try the demo."
                );
            },

            onLoginSuccess: function (oUserData) {
                if (!oUserData || !oUserData.name) {
                    MessageBox.error("User information was not received.");
                    return;
                }

                this.getView().getModel("user").setProperty("/name", oUserData.name);
                MessageToast.show("Welcome back, " + oUserData.name + "!");
            },

            // -------------------------------------------------
            // DIALOG AND DISPLAY HELPERS
            // -------------------------------------------------

            _showDialog: function (sTitle, aContent) {
                if (this._oActiveDialog) {
                    this._oActiveDialog.destroy();
                }

                var oDialog = new Dialog({
                    title: sTitle,
                    contentWidth: "55rem",
                    contentHeight: "auto",
                    horizontalScrolling: false,
                    verticalScrolling: true,
                    stretchOnPhone: true,

                    content: [
                        new VBox({
                            width: "100%",
                            items: aContent
                        }).addStyleClass("sapUiContentPadding")
                    ],

                    endButton: new Button({
                        text: "Close",
                        type: "Transparent",
                        press: function () {
                            oDialog.close();
                        }
                    }),

                    afterClose: function () {
                        oDialog.destroy();
                        this._oActiveDialog = null;
                    }.bind(this)
                });

                this._oActiveDialog = oDialog;
                oDialog.open();
            },

            _sectionTitle: function (sText) {
                return new Title({
                    text: sText,
                    level: "H3"
                }).addStyleClass("sapUiMediumMarginTop sapUiSmallMarginBottom");
            },

            _sectionText: function (sText) {
                return new Text({
                    text: sText,
                    wrapping: true
                }).addStyleClass("sapUiSmallMarginBottom");
            },

            _showSection: function (sTitle, sDescription, aItems) {
                var aContent = [
                    this._sectionText(sDescription),
                    new List({
                        items: aItems.map(function (sItem) {
                            return new StandardListItem({
                                title: sItem,
                                type: "Inactive"
                            });
                        })
                    })
                ];

                this._showDialog(sTitle, aContent);
            },

            // -------------------------------------------------
            // BACKEND PROFILE FUNCTIONS
            // -------------------------------------------------

            _loadSavedProfile: async function () {
                try {
                    var oResponse = await fetch(
                        "/career/Profiles?$orderby=modifiedAt%20desc&$top=1",
                        { headers: { "Accept": "application/json" } }
                    );

                    if (!oResponse.ok) {
                        throw new Error("Profile service returned " + oResponse.status);
                    }

                    var oData = await oResponse.json();

                    if (oData.value && oData.value.length) {
                        var oProfile = oData.value[0];
                        var oModel = this.getView().getModel("user");
                        var aCompleted = [];

                        try {
                            aCompleted = oProfile.completedActivities
                                ? JSON.parse(oProfile.completedActivities)
                                : [];
                        } catch (e) {
                            aCompleted = [];
                        }

                        if (!Array.isArray(aCompleted)) {
                            aCompleted = [];
                        }

                        oModel.setProperty("/profileID", oProfile.ID || "");
                        oModel.setProperty("/name", oProfile.name || "Your Name");
                        oModel.setProperty("/email", oProfile.email || "");
                        oModel.setProperty("/currentRole", oProfile.currentRole || "");
                        oModel.setProperty("/targetRole", oProfile.targetRole || "");
                        oModel.setProperty("/workExperience", oProfile.workExperience || "");

                        oModel.setProperty(
                            "/experience",
                            oProfile.yearsExperience == null
                                ? ""
                                : String(oProfile.yearsExperience)
                        );

                        oModel.setProperty(
                            "/skills",
                            oProfile.skills
                                ? oProfile.skills.split(/,\s*/).filter(Boolean)
                                : []
                        );

                        oModel.setProperty("/completedActivities", aCompleted);
                        oModel.setProperty(
                            "/learningProgress",
                            oProfile.learningProgress || aCompleted.length
                        );
                    }
                } catch (oError) {
                    console.warn("Could not load saved profile:", oError);
                }
            },

            _getCsrfToken: async function () {
                var oResponse = await fetch("/career/$metadata", {
                    method: "GET",
                    headers: { "X-CSRF-Token": "Fetch" }
                });

                if (!oResponse.ok) {
                    throw new Error(
                        "Could not obtain security token (" + oResponse.status + ")."
                    );
                }

                return oResponse.headers.get("X-CSRF-Token") || "";
            },

            _saveProfileToBackend: async function (oProfile) {
                var sToken = await this._getCsrfToken();
                var bUpdate = Boolean(oProfile.ID);

                var sUrl = "/career/Profiles" +
                    (bUpdate ? "(" + encodeURIComponent(oProfile.ID) + ")" : "");

                var oBody = Object.assign({}, oProfile);
                delete oBody.ID;

                var oResponse = await fetch(sUrl, {
                    method: bUpdate ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-Token": sToken
                    },
                    body: JSON.stringify(oBody)
                });

                if (!oResponse.ok) {
                    throw new Error(
                        "Profile could not be saved (" +
                        oResponse.status + "): " + await oResponse.text()
                    );
                }

                if (!bUpdate) {
                    var oCreated = await oResponse.json();
                    return oCreated.ID;
                }

                return oProfile.ID;
            },

            _saveLearningProgress: async function (aCompleted) {
                var oModel = this.getView().getModel("user");
                var sID = oModel.getProperty("/profileID");

                if (!sID) {
                    throw new Error(
                        "Please save your profile before saving learning progress."
                    );
                }

                var oPayload = {
                    ID: sID,
                    name: oModel.getProperty("/name") || "Your Name",
                    email: oModel.getProperty("/email") || null,
                    currentRole: oModel.getProperty("/currentRole") || "",
                    yearsExperience: Number(oModel.getProperty("/experience")) || 0,
                    skills: (oModel.getProperty("/skills") || []).join(", "),
                    workExperience: oModel.getProperty("/workExperience") || "",
                    targetRole: oModel.getProperty("/targetRole") || "",
                    completedActivities: JSON.stringify(aCompleted),
                    learningProgress: aCompleted.length
                };

                var sSavedID = await this._saveProfileToBackend(oPayload);

                oModel.setProperty("/profileID", sSavedID);
                oModel.setProperty("/completedActivities", aCompleted);
                oModel.setProperty("/learningProgress", aCompleted.length);

                return true;
            },

            _addApprovedSkill: async function (sSkill) {
                var oModel = this.getView().getModel("user");
                var aSkills = (oModel.getProperty("/skills") || []).slice();

                if (aSkills.some(function (s) {
                    return s.toLowerCase() === sSkill.toLowerCase();
                })) {
                    MessageToast.show("This skill is already in your profile.");
                    return;
                }

                aSkills.push(sSkill);

                var oPayload = {
                    ID: oModel.getProperty("/profileID") || undefined,
                    name: oModel.getProperty("/name") || "Your Name",
                    email: oModel.getProperty("/email") || null,
                    currentRole: oModel.getProperty("/currentRole") || "",
                    yearsExperience: Number(oModel.getProperty("/experience")) || 0,
                    skills: aSkills.join(", "),
                    workExperience: oModel.getProperty("/workExperience") || "",
                    targetRole: oModel.getProperty("/targetRole") || "",
                    completedActivities: JSON.stringify(
                        oModel.getProperty("/completedActivities") || []
                    ),
                    learningProgress: (
                        oModel.getProperty("/completedActivities") || []
                    ).length
                };

                var sID = await this._saveProfileToBackend(oPayload);

                oModel.setProperty("/profileID", sID || oPayload.ID || "");
                oModel.setProperty("/skills", aSkills);

                return true;
            },

            // -------------------------------------------------
            // OVERVIEW
            // -------------------------------------------------

            onNavOverview: function () {
                MessageToast.show("You are already on the Overview dashboard.");
            },

            // -------------------------------------------------
            // MY PROFILE
            // -------------------------------------------------

            onNavProfile: function () {
                var oModel = this.getView().getModel("user");
                var oController = this;

                var aRoles = [
                    ["Administration", "Administrative Assistant|Administrative Coordinator|Senior Administrative Coordinator|Administrative Executive|Senior Administrative Executive|Office Administrator|Office Manager|Assistant Office Manager|Executive Assistant|Senior Executive Assistant|Personal Assistant|Secretary|Senior Secretary|Receptionist|Front Desk Executive|Front Office Executive|Office Support Executive|Administrative Support Specialist|Administration Officer|Administration Manager|Department Administrator|Branch Administrator|Facilities Administrator|Facilities Coordinator|Records Clerk|Records Officer|Records Manager|Document Controller|Document Management Specialist|Data Entry Operator|Data Entry Executive|Clerical Assistant|Clerk|Office Clerk|Filing Clerk|Mailroom Clerk|Correspondence Clerk|Office Services Coordinator"],
                    ["Operations", "Operations Assistant|Operations Associate|Operations Coordinator|Senior Operations Coordinator|Operations Executive|Operations Administrator|Operations Officer|Operations Manager|Business Operations Associate|Business Operations Coordinator|Business Support Executive|Business Support Analyst|Process Coordinator|Process Associate|Process Executive|Workflow Coordinator|Service Operations Coordinator|Service Delivery Coordinator|Resource Coordinator|Workforce Coordinator|Scheduling Coordinator|Planning Coordinator|Logistics Coordinator|Logistics Executive|Inventory Coordinator|Supply Chain Assistant|Supply Chain Coordinator|Dispatch Coordinator|Order Processing Executive|Order Management Specialist"],
                    ["Human Resources", "HR Assistant|HR Administrator|HR Coordinator|HR Executive|HR Operations Associate|HR Operations Executive|HR Officer|HR Generalist|HR Analyst|Recruitment Coordinator|Recruitment Assistant|Talent Acquisition Coordinator|Onboarding Specialist|Employee Relations Assistant|Personnel Administrator|Payroll Assistant|Payroll Executive|Training Coordinator|Learning and Development Coordinator|People Operations Associate"],
                    ["Finance and Procurement", "Accounts Assistant|Accounts Executive|Accounting Clerk|Finance Assistant|Finance Administrator|Finance Executive|Billing Executive|Invoicing Specialist|Accounts Payable Assistant|Accounts Receivable Assistant|Payroll Administrator|Procurement Assistant|Procurement Executive|Procurement Coordinator|Purchasing Assistant|Purchasing Coordinator|Vendor Coordinator|Vendor Management Executive|Purchase Officer|Commercial Assistant"],
                    ["Customer Support", "Customer Service Assistant|Customer Support Executive|Customer Support Specialist|Customer Experience Associate|Client Service Coordinator|Client Relations Executive|Customer Relations Officer|Help Desk Executive|Service Desk Coordinator|Call Centre Executive|Contact Centre Associate|Order Support Executive|Service Coordinator|Complaint Resolution Executive"],
                    ["Projects and Business", "Project Assistant|Project Administrator|Project Coordinator|Senior Project Coordinator|Program Assistant|Program Coordinator|PMO Analyst|PMO Coordinator|Business Analyst Assistant|Junior Business Analyst|Business Support Analyst|Reporting Coordinator|MIS Executive|MIS Analyst|Management Information Executive|Quality Coordinator|Quality Assurance Assistant|Compliance Assistant|Compliance Coordinator|Audit Assistant|Risk Administration Assistant"],
                    ["Education and Healthcare", "School Administrator|Academic Coordinator|Admissions Coordinator|Student Services Coordinator|Education Administrator|Training Administrator|College Office Assistant|Hospital Administrator|Healthcare Administrator|Medical Records Assistant|Patient Services Coordinator|Clinic Coordinator|Medical Office Assistant"],
                    ["Technology and Data", "IT Support Assistant|IT Administrator|IT Coordinator|Technical Support Executive|Data Analyst Assistant|Junior Data Analyst|Reporting Analyst|Data Management Associate|Database Assistant|CRM Administrator|ERP Coordinator|Systems Administrator Assistant|Digital Operations Assistant|Automation Support Associate"]
                ];

                var aSkillGroups = [
                    ["Office and Administration", "Office Administration|Administrative Support|Office Management|Calendar Management|Meeting Coordination|Appointment Scheduling|Travel Arrangements|Email Management|Inbox Management|Telephone Etiquette|Reception Management|Visitor Management|Filing|Document Management|Records Management|Digital Filing|Data Entry|Typing|Proofreading|Correspondence Handling|Report Preparation|Minutes Writing|Note Taking|Presentation Preparation|Document Formatting|Information Management"],
                    ["Microsoft and Productivity Tools", "Microsoft Word|Microsoft Excel|Advanced Excel|Excel Formulas|Pivot Tables|VLOOKUP|XLOOKUP|Microsoft PowerPoint|Microsoft Outlook|Microsoft Teams|Microsoft OneNote|SharePoint|Google Docs|Google Sheets|Google Slides|Google Drive|Google Workspace|Microsoft 365|PDF Editing|Spreadsheet Management|Data Validation|Mail Merge|Online Collaboration"],
                    ["Data and Technology", "Data Analysis|Data Cleaning|Data Interpretation|Data Visualization|Dashboard Creation|Power BI|Tableau|SQL|MySQL|Python|R Programming|Basic Statistics|MIS Reporting|Data Reporting|KPI Tracking|Database Management|Data Management|Data Quality|Digital Literacy|AI Literacy|Generative AI Tools|Prompt Writing|AI-Assisted Research|Workflow Automation|Process Automation|No-Code Tools|Low-Code Tools|ERP Systems|SAP|CRM Software|HRMS Software|Cloud Applications|Cybersecurity Awareness|Information Security"],
                    ["Communication and People", "Verbal Communication|Written Communication|Business Communication|Professional Email Writing|Presentation Skills|Active Listening|Interpersonal Skills|Teamwork|Collaboration|Stakeholder Communication|Customer Communication|Client Relationship Management|Vendor Communication|Negotiation|Conflict Resolution|Customer Service|Customer Relationship Management|Cross-functional Coordination|People Skills|Empathy|Cultural Awareness|Public Speaking"],
                    ["Planning and Management", "Time Management|Task Management|Prioritisation|Planning|Organising|Organisation Skills|Project Coordination|Project Management|Program Coordination|Resource Planning|Workload Management|Deadline Management|Problem Solving|Critical Thinking|Decision Making|Analytical Thinking|Attention to Detail|Multitasking|Adaptability|Flexibility|Leadership|Team Coordination|Performance Tracking|Risk Management|Quality Management|Process Improvement|Process Mapping|Workflow Management|Change Management"],
                    ["HR and People Operations", "Human Resources Administration|Recruitment Support|Candidate Coordination|Interview Scheduling|Employee Onboarding|Employee Offboarding|Employee Records Management|Attendance Management|Leave Management|Payroll Coordination|Training Coordination|Learning and Development|Employee Engagement|HR Documentation|HR Reporting|Performance Administration"],
                    ["Finance and Procurement", "Basic Accounting|Bookkeeping|Invoice Processing|Billing|Expense Tracking|Budget Monitoring|Financial Reporting|Accounts Payable|Accounts Receivable|Purchase Orders|Procurement Support|Vendor Management|Supplier Coordination|Inventory Tracking|Cost Tracking|Payment Follow-up|Reconciliation"],
                    ["Business and Compliance", "Business Process Knowledge|Operations Management|Business Analysis|Compliance Monitoring|Policy Administration|Audit Support|Documentation Standards|Standard Operating Procedures|SOP Development|Quality Assurance|Quality Control|Data Privacy Awareness|Risk Identification|Service Delivery|Business Continuity Awareness"],
                    ["Logistics and Customer Support", "Logistics Coordination|Order Processing|Order Management|Dispatch Coordination|Supply Chain Basics|Stock Management|Customer Query Resolution|Complaint Handling|Ticket Management|Help Desk Support|Service Desk Support|Customer Feedback Analysis|Client Support|After-sales Support"]
                ];

                function makeCatalog(aGroups) {
                    var aResult = [];

                    aGroups.forEach(function (aGroup) {
                        aGroup[1].split("|").forEach(function (sName) {
                            aResult.push({
                                category: aGroup[0],
                                title: sName
                            });
                        });
                    });

                    return aResult;
                }

                var aRoleCatalog = makeCatalog(aRoles);
                var aSkillCatalog = makeCatalog(aSkillGroups);
                var aSelectedSkills = (oModel.getProperty("/skills") || []).slice();

                var oName = new Input({
                    value: oModel.getProperty("/name"),
                    placeholder: "Enter your full name"
                });

                var oEmail = new Input({
                    value: oModel.getProperty("/email"),
                    placeholder: "Enter your email address",
                    type: "Email"
                });

                var oRole = new Input({
                    value: oModel.getProperty("/currentRole"),
                    placeholder: "Click to select or type your current role"
                });

                var oExperience = new Input({
                    value: oModel.getProperty("/experience"),
                    placeholder: "Years of professional experience",
                    type: "Number"
                });

                var oRoleSearch = new SearchField({
                    width: "100%",
                    placeholder: "Search current roles..."
                });

                var oRoleList = new List({
                    width: "100%",
                    visible: false,
                    growing: true,
                    growingThreshold: 20,
                    noDataText: "No matching roles found."
                });

                var oSkillSearch = new SearchField({
                    width: "100%",
                    placeholder: "Search skills..."
                });

                var oSkillList = new List({
                    width: "100%",
                    visible: false,
                    growing: true,
                    growingThreshold: 20,
                    noDataText: "No matching skills found."
                });

                var oRoleClose = new Button({
                    text: "Close role suggestions",
                    type: "Transparent",
                    press: function () {
                        oRoleList.setVisible(false);
                        oRoleSearch.setValue("");
                    }
                });

                var oSkillClose = new Button({
                    text: "Close skill suggestions",
                    type: "Transparent",
                    press: function () {
                        oSkillList.setVisible(false);
                        oSkillSearch.setValue("");
                    }
                });

                var oCustomSkill = new Input({
                    width: "100%",
                    placeholder: "Enter another skill"
                });

                var oSelectedBox = new VBox({
                    width: "100%"
                });

                var oSave = new Button({
                    text: "Save Profile",
                    type: "Emphasized",
                    width: "100%"
                });

                function renderSelectedSkills() {
                    oSelectedBox.removeAllItems();

                    if (!aSelectedSkills.length) {
                        oSelectedBox.addItem(new Text({
                            text: "No skills selected yet. Use the search above to add your skills.",
                            wrapping: true
                        }));
                        return;
                    }

                    aSelectedSkills.forEach(function (sSkill, i) {
                        var oRemove = new Button({
                            text: "Remove",
                            type: "Transparent",
                            press: function () {
                                aSelectedSkills.splice(i, 1);
                                renderSelectedSkills();

                                if (oSkillList.getVisible()) {
                                    renderSkillSuggestions(oSkillSearch.getValue());
                                }
                            }
                        });

                        oSelectedBox.addItem(new HBox({
                            width: "100%",
                            justifyContent: "SpaceBetween",
                            alignItems: "Center",
                            items: [
                                new Text({
                                    text: sSkill,
                                    wrapping: true,
                                    width: "75%"
                                }),
                                oRemove
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"));
                    });
                }

                function addSkill(sSkill) {
                    sSkill = (sSkill || "").trim();

                    if (!sSkill) {
                        return;
                    }

                    var bExists = aSelectedSkills.some(function (sExisting) {
                        return sExisting.toLowerCase() === sSkill.toLowerCase();
                    });

                    if (bExists) {
                        MessageToast.show("This skill is already selected.");
                        return;
                    }

                    aSelectedSkills.push(sSkill);
                    renderSelectedSkills();

                    // Close after selecting; user can reopen by clicking search.
                    oSkillList.setVisible(false);
                    oSkillSearch.setValue("");

                    MessageToast.show(sSkill + " added to your selection.");
                }

                function renderRoleSuggestions(sQuery) {
                    oRoleList.removeAllItems();

                    var sSearch = (sQuery || "").toLowerCase();
                    var sLastCategory = "";

                    aRoleCatalog.filter(function (oItem) {
                        return (
                            oItem.title.toLowerCase().indexOf(sSearch) !== -1 ||
                            oItem.category.toLowerCase().indexOf(sSearch) !== -1
                        );
                    }).forEach(function (oItem) {
                        if (oItem.category !== sLastCategory) {
                            oRoleList.addItem(new GroupHeaderListItem({
                                title: oItem.category
                            }));
                            sLastCategory = oItem.category;
                        }

                        oRoleList.addItem(new StandardListItem({
                            title: oItem.title,
                            type: "Active",
                            press: function () {
                                oRole.setValue(oItem.title);
                                oRoleList.setVisible(false);
                                oRoleSearch.setValue("");
                                MessageToast.show(
                                    "Current role selected. Click Save Profile to save."
                                );
                            }
                        }));
                    });
                }

                function renderSkillSuggestions(sQuery) {
                    oSkillList.removeAllItems();

                    var sSearch = (sQuery || "").toLowerCase();
                    var sLastCategory = "";

                    aSkillCatalog.filter(function (oItem) {
                        return (
                            oItem.title.toLowerCase().indexOf(sSearch) !== -1 ||
                            oItem.category.toLowerCase().indexOf(sSearch) !== -1
                        );
                    }).forEach(function (oItem) {
                        if (oItem.category !== sLastCategory) {
                            oSkillList.addItem(new GroupHeaderListItem({
                                title: oItem.category
                            }));
                            sLastCategory = oItem.category;
                        }

                        var bSelected = aSelectedSkills.some(function (s) {
                            return s.toLowerCase() === oItem.title.toLowerCase();
                        });

                        oSkillList.addItem(new StandardListItem({
                            title: (bSelected ? "✓  " : "+  ") + oItem.title,
                            type: "Active",
                            press: function () {
                                addSkill(oItem.title);
                            }
                        }));
                    });
                }

                // Suggestions open only when the user clicks the field.
                oRole.attachBrowserEvent("click", function () {
                    renderRoleSuggestions(oRoleSearch.getValue());
                    oRoleList.setVisible(true);
                });

                oRoleSearch.attachBrowserEvent("click", function () {
                    renderRoleSuggestions(oRoleSearch.getValue());
                    oRoleList.setVisible(true);
                });

                oSkillSearch.attachBrowserEvent("click", function () {
                    renderSkillSuggestions(oSkillSearch.getValue());
                    oSkillList.setVisible(true);
                });

                oRoleSearch.attachLiveChange(function (oEvent) {
                    renderRoleSuggestions(oEvent.getParameter("newValue"));
                    oRoleList.setVisible(true);
                });

                oSkillSearch.attachLiveChange(function (oEvent) {
                    renderSkillSuggestions(oEvent.getParameter("newValue"));
                    oSkillList.setVisible(true);
                });

                var oAddCustomSkill = new Button({
                    text: "Add Custom Skill",
                    press: function () {
                        addSkill(oCustomSkill.getValue());
                        oCustomSkill.setValue("");
                    }
                });

                renderSelectedSkills();

                oSave.attachPress(async function () {
                    var sName = oName.getValue().trim();
                    var sEmail = oEmail.getValue().trim();
                    var sRole = oRole.getValue().trim();
                    var nExperience = Number(oExperience.getValue());

                    if (
                        !sName ||
                        !sRole ||
                        oExperience.getValue().trim() === "" ||
                        !Number.isFinite(nExperience) ||
                        nExperience < 0
                    ) {
                        MessageBox.warning(
                            "Please enter your name, current role and a valid number of experience years."
                        );
                        return;
                    }

                    if (sEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
                        MessageBox.warning("Please enter a valid email address.");
                        return;
                    }

                    var oPayload = {
                        ID: oModel.getProperty("/profileID") || undefined,
                        name: sName,
                        email: sEmail || null,
                        currentRole: sRole,
                        yearsExperience: nExperience,
                        skills: aSelectedSkills.join(", "),
                        workExperience: oModel.getProperty("/workExperience") || "",
                        targetRole: oModel.getProperty("/targetRole") || "",
                        completedActivities: JSON.stringify(
                            oModel.getProperty("/completedActivities") || []
                        ),
                        learningProgress: (
                            oModel.getProperty("/completedActivities") || []
                        ).length
                    };

                    oSave.setEnabled(false);
                    oSave.setText("Saving...");

                    try {
                        var sID = await oController._saveProfileToBackend(oPayload);

                        oModel.setProperty("/profileID", sID || oPayload.ID || "");
                        oModel.setProperty("/name", sName);
                        oModel.setProperty("/email", sEmail);
                        oModel.setProperty("/currentRole", sRole);
                        oModel.setProperty("/experience", String(nExperience));
                        oModel.setProperty("/skills", aSelectedSkills.slice());

                        MessageBox.success(
                            "Your profile has been saved to the Career Orchestrator backend."
                        );

                        oController._oActiveDialog.close();

                    } catch (oError) {
                        MessageBox.error(
                            oError.message +
                            "\n\nMake sure the SAP CAP backend is running at http://localhost:4004."
                        );
                    } finally {
                        oSave.setEnabled(true);
                        oSave.setText("Save Profile");
                    }
                });

                this._showDialog("My Profile | Career Foundation", [
                    this._sectionText(
                        "Build your professional identity. Your experience and transferable skills help Career Orchestrator identify realistic career pathways and personalised development opportunities."
                    ),

                    this._sectionTitle("Personal Information"),
                    new Label({ text: "Full name" }),
                    oName,

                    new Label({ text: "Email address" }),
                    oEmail,

                    this._sectionTitle("Professional Background"),
                    new Label({ text: "Current role" }),
                    oRole,
                    oRoleSearch,
                    oRoleList,
                    oRoleClose,

                    new Label({ text: "Years of experience" }),
                    oExperience,

                    this._sectionTitle("Skills Portfolio"),
                    this._sectionText(
                        "Select the skills you currently possess. You can search by skill name or category and add your own skills."
                    ),
                    new Label({ text: "Search and select your skills" }),
                    oSkillSearch,
                    oSkillList,
                    oSkillClose,

                    new Label({ text: "Add a skill not listed above" }),
                    oCustomSkill,
                    oAddCustomSkill,

                    this._sectionTitle("Your Selected Skills"),
                    oSelectedBox,
                    new Text({
                        text: "Your information is saved through the SAP CAP backend when you select Save Profile.",
                        wrapping: true
                    }).addStyleClass("sapUiSmallMarginTop"),
                    oSave
                ]);
            },

            // -------------------------------------------------
            // STEP 2: PERSONALIZED SKILLS DISCOVERY
            // -------------------------------------------------

            onNavSkills: function () {
                var oController = this;
                var oModel = this.getView().getModel("user");

                var oWork = new TextArea({
                    width: "100%",
                    rows: 6,
                    value: oModel.getProperty("/workExperience") || "",
                    placeholder: "Describe your daily responsibilities, tools you use, people you work with and tasks you handle..."
                });

                var oResult = new VBox({
                    width: "100%"
                });

                var aApproved = [];

                var aRules = [
                    {
                        skill: "Documentation and Records Management",
                        words: /record|document|filing|maintain files|employee details|database|paperwork|archive|register|data entry/
                    },
                    {
                        skill: "Scheduling and Coordination",
                        words: /schedule|calendar|meeting|appointment|coordinate|organize events|interview|travel arrangement/
                    },
                    {
                        skill: "Reporting and Data Handling",
                        words: /report|excel|spreadsheet|data|analyse|analyze|statistics|dashboard|monthly report|mis/
                    },
                    {
                        skill: "Stakeholder Communication",
                        words: /vendor|customer|client|communicat|correspond|liaise|team|department|follow up|email/
                    },
                    {
                        skill: "Planning and Task Management",
                        words: /plan|prioriti|deadline|task|organis|organiz|manage workload|project|tracker/
                    },
                    {
                        skill: "Process and Operations Management",
                        words: /process|operation|workflow|procedure|daily activities|office activities|business operations/
                    },
                    {
                        skill: "Problem Solving",
                        words: /problem|resolve|issue|troubleshoot|handle complaints|correct errors|investigate/
                    },
                    {
                        skill: "Time Management",
                        words: /time|deadline|multiple tasks|on time|timely|urgent|workload/
                    },
                    {
                        skill: "Financial Administration",
                        words: /invoice|billing|payment|budget|expense|accounts|salary|payroll|reconciliation/
                    },
                    {
                        skill: "Human Resource Administration",
                        words: /employee|attendance|leave|payroll|recruit|onboard|staff|hr department|personnel|candidate/
                    },
                    {
                        skill: "Customer Service",
                        words: /customer service|customer support|queries|complaints|client support|customer questions/
                    },
                    {
                        skill: "Inventory Management",
                        words: /inventory|stock|warehouse|supplies|materials|dispatch|orders/
                    },
                    {
                        skill: "Digital Tools and Technology",
                        words: /software|computer|digital tools|applications|systems|technology|microsoft|google workspace|sap|crm|hrms/
                    },
                    {
                        skill: "Workflow Automation Awareness",
                        words: /automation|automate|automated|repetitive tasks|digital workflow/
                    },
                    {
                        skill: "Research and Information Gathering",
                        words: /research|gather information|collect information|online search|verify information/
                    },
                    {
                        skill: "Team Coordination",
                        words: /team|colleagues|department|cross.functional|collaborate|staff members/
                    },
                    {
                        skill: "Quality and Compliance Monitoring",
                        words: /quality|compliance|policy|audit|accuracy|check records|verify records|standards/
                    },
                    {
                        skill: "Project Coordination",
                        words: /project|project timeline|project progress|milestone|deliverable|project tracking/
                    },
                    {
                        skill: "Vendor and Supplier Management",
                        words: /vendor|supplier|purchase order|procurement|quotation|supplier communication/
                    },
                    {
                        skill: "Training and Employee Development",
                        words: /training|workshop|learning session|employee development|training session/
                    },
                    {
                        skill: "Data Accuracy and Validation",
                        words: /data accuracy|validate data|verify data|correct data|data quality|error checking/
                    },
                    {
                        skill: "Customer Relationship Management",
                        words: /client relationship|customer relationship|customer feedback|client communication|customer retention/
                    }
                ];

                var oAnalyze = new Button({
                    text: "Analyse My Experience",
                    type: "Emphasized",
                    width: "100%",

                    press: function () {
                        var sWork = oWork.getValue().trim().toLowerCase();
                        var sRole = (
                            oModel.getProperty("/currentRole") || ""
                        ).toLowerCase();

                        if (!sWork) {
                            MessageBox.warning("Please describe your daily work.");
                            return;
                        }

                        if (/hr|human resource|personnel/.test(sRole)) {
                            sWork += " employee staff attendance recruitment";
                        }

                        if (/finance|account|billing/.test(sRole)) {
                            sWork += " invoice payment accounts";
                        }

                        if (/operation|administrat|office/.test(sRole)) {
                            sWork += " office coordination records";
                        }

                        var aExisting = oModel.getProperty("/skills") || [];
                        var aDiscovered = [];

                        aRules.forEach(function (oRule) {
                            if (oRule.words.test(sWork)) {
                                var bExists = aExisting.some(function (s) {
                                    return s.toLowerCase() === oRule.skill.toLowerCase();
                                });

                                if (!bExists) {
                                    aDiscovered.push(oRule.skill);
                                }
                            }
                        });

                        oResult.removeAllItems();
                        aApproved = [];

                        oResult.addItem(oController._sectionTitle(
                            "Your Transferable Skills Report"
                        ));

                        if (!aDiscovered.length) {
                            oResult.addItem(new Text({
                                text: "No new transferable skills were identified. Your description may match skills already saved in your profile. Try describing specific tasks, tools, decisions and responsibilities in more detail.",
                                wrapping: true
                            }));

                            return;
                        }

                        oResult.addItem(new Text({
                            text: aDiscovered.length +
                                " potential transferable skills were identified from your work description. Review and select only the skills that genuinely represent your experience.",
                            wrapping: true
                        }).addStyleClass("sapUiSmallMarginBottom"));

                        aDiscovered.forEach(function (sSkill) {
                            var oCheck = new CheckBox({
                                text: sSkill,
                                selected: true
                            });

                            aApproved.push({
                                skill: sSkill,
                                checkbox: oCheck
                            });

                            oResult.addItem(oCheck);
                        });

                        var oSaveApproved = new Button({
                            text: "Approve and Save Selected Skills",
                            type: "Emphasized",
                            width: "100%",

                            press: async function () {
                                var aSelected = aApproved.filter(function (oItem) {
                                    return oItem.checkbox.getSelected();
                                }).map(function (oItem) {
                                    return oItem.skill;
                                });

                                if (!aSelected.length) {
                                    MessageToast.show("Please select at least one skill.");
                                    return;
                                }

                                var aSkills = (
                                    oModel.getProperty("/skills") || []
                                ).slice();

                                aSelected.forEach(function (sSkill) {
                                    if (!aSkills.some(function (s) {
                                        return s.toLowerCase() === sSkill.toLowerCase();
                                    })) {
                                        aSkills.push(sSkill);
                                    }
                                });

                                var oPayload = {
                                    ID: oModel.getProperty("/profileID") || undefined,
                                    name: oModel.getProperty("/name") || "Your Name",
                                    email: oModel.getProperty("/email") || null,
                                    currentRole: oModel.getProperty("/currentRole") || "",
                                    yearsExperience: Number(oModel.getProperty("/experience")) || 0,
                                    skills: aSkills.join(", "),
                                    workExperience: oWork.getValue().trim(),
                                    targetRole: oModel.getProperty("/targetRole") || "",
                                    completedActivities: JSON.stringify(
                                        oModel.getProperty("/completedActivities") || []
                                    ),
                                    learningProgress: (
                                        oModel.getProperty("/completedActivities") || []
                                    ).length
                                };

                                oSaveApproved.setEnabled(false);
                                oSaveApproved.setText("Saving...");

                                try {
                                    var sID = await oController._saveProfileToBackend(oPayload);

                                    oModel.setProperty("/profileID", sID || oPayload.ID || "");
                                    oModel.setProperty("/skills", aSkills);
                                    oModel.setProperty("/workExperience", oWork.getValue().trim());

                                    MessageBox.success(
                                        aSelected.length +
                                        " new skills have been added to your profile."
                                    );

                                } catch (oError) {
                                    MessageBox.error(
                                        "Could not save your skills.\n\n" + oError.message
                                    );
                                } finally {
                                    oSaveApproved.setEnabled(true);
                                    oSaveApproved.setText("Approve and Save Selected Skills");
                                }
                            }
                        });

                        oResult.addItem(oSaveApproved);
                    }
                });

                this._showDialog("Skills Discovery | Experience Intelligence", [
                    this._sectionText(
                        "Your previous job title does not define your future. Describe the work you actually perform, and Career Orchestrator will identify transferable capabilities that can support your next career move."
                    ),

                    this._sectionTitle("Describe Your Work"),
                    new Label({ text: "Daily responsibilities and experience" }),
                    oWork,

                    new Text({
                        text: "Tip: Include the tasks you perform, software you use, reports you prepare, people you coordinate with and problems you solve.",
                        wrapping: true
                    }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBottom"),

                    oAnalyze,

                    this._sectionTitle("Your Skills Analysis"),
                    oResult,

                    new Text({
                        text: "Prototype transparency: Skills are identified using contextual keyword rules. A live generative AI model is not yet connected.",
                        wrapping: true
                    }).addStyleClass("sapUiMediumMarginTop")
                ]);
            },

            // -------------------------------------------------
            // STEP 3: MARKET INTELLIGENCE
            // -------------------------------------------------

            onNavMarket: function () {
                var oController = this;
                var oModel = this.getView().getModel("user");

                var aSkills = oModel.getProperty("/skills") || [];
                var sCurrentRole = oModel.getProperty("/currentRole") || "";
                var sWork = oModel.getProperty("/workExperience") || "";
                var nExperience = Number(oModel.getProperty("/experience")) || 0;

                var sProfileText = (
                    sCurrentRole + " " + sWork + " " + aSkills.join(" ")
                ).toLowerCase();

                if (!aSkills.length && !sWork.trim()) {
                    this._showDialog("Market Intelligence", [
                        this._sectionText(
                            "Build your profile and describe your work experience first. Career Orchestrator uses your existing capabilities to identify adjacent career pathways."
                        ),
                        new Button({
                            text: "Go to Skills Discovery",
                            type: "Emphasized",
                            press: function () {
                                oController._oActiveDialog.close();
                                oController.onNavSkills();
                            }
                        })
                    ]);
                    return;
                }

                var aCareerRoles = [
                    {
                        title: "HR Operations Associate",
                        description: "Supports employee records, attendance, onboarding and HR activities.",
                        keywords: /employee|attendance|payroll|recruit|onboard|leave|staff|human resource/,
                        skills: ["Documentation and Records Management", "Stakeholder Communication", "Scheduling and Coordination", "Human Resource Administration"]
                    },
                    {
                        title: "Operations Coordinator",
                        description: "Coordinates daily business operations, schedules and administrative processes.",
                        keywords: /operation|workflow|office|administrat|process|coordination/,
                        skills: ["Scheduling and Coordination", "Documentation and Records Management", "Process and Operations Management", "Planning and Task Management"]
                    },
                    {
                        title: "Project Coordinator",
                        description: "Supports project timelines, team communication and progress tracking.",
                        keywords: /project|planning|deadline|team|meeting|coordination/,
                        skills: ["Scheduling and Coordination", "Stakeholder Communication", "Planning and Task Management", "Reporting and Data Handling"]
                    },
                    {
                        title: "Operations Analyst",
                        description: "Analyses business information and reports to improve operations.",
                        keywords: /data|report|excel|spreadsheet|analysis|analyse|analyze|operation/,
                        skills: ["Reporting and Data Handling", "Process and Operations Management", "Documentation and Records Management", "Problem Solving"]
                    },
                    {
                        title: "Administrative Services Specialist",
                        description: "Manages office documentation, records and administrative services.",
                        keywords: /administrat|office|document|record|filing|correspondence/,
                        skills: ["Documentation and Records Management", "Planning and Task Management", "Stakeholder Communication", "Time Management"]
                    },
                    {
                        title: "Customer Success Associate",
                        description: "Supports customers, handles queries and maintains client relationships.",
                        keywords: /customer|client|support|complaint|service|queries/,
                        skills: ["Customer Service", "Stakeholder Communication", "Problem Solving", "Documentation and Records Management"]
                    },
                    {
                        title: "Procurement Coordinator",
                        description: "Coordinates purchase requests, suppliers, invoices and vendor records.",
                        keywords: /vendor|supplier|purchase|procurement|invoice|stock|inventory/,
                        skills: ["Stakeholder Communication", "Documentation and Records Management", "Financial Administration", "Planning and Task Management"]
                    },
                    {
                        title: "Reporting and MIS Executive",
                        description: "Prepares business reports, maintains spreadsheets and tracks performance.",
                        keywords: /report|excel|spreadsheet|data|mis|dashboard|statistics/,
                        skills: ["Reporting and Data Handling", "Digital Tools and Technology", "Documentation and Records Management", "Problem Solving"]
                    },
                    {
                        title: "Business Support Analyst",
                        description: "Supports business teams through process documentation and information analysis.",
                        keywords: /business|process|data|report|workflow|analysis|operation/,
                        skills: ["Process and Operations Management", "Reporting and Data Handling", "Problem Solving", "Stakeholder Communication"]
                    },
                    {
                        title: "Training and Learning Coordinator",
                        description: "Coordinates employee training, learning schedules and development activities.",
                        keywords: /training|learning|education|employee|schedule|development/,
                        skills: ["Scheduling and Coordination", "Stakeholder Communication", "Planning and Task Management", "Documentation and Records Management"]
                    },
                    {
                        title: "Data Management Associate",
                        description: "Maintains digital records, checks data quality and organises information.",
                        keywords: /data|database|record|document|spreadsheet|digital/,
                        skills: ["Documentation and Records Management", "Reporting and Data Handling", "Digital Tools and Technology", "Problem Solving"]
                    },
                    {
                        title: "Workflow Automation Coordinator",
                        description: "Identifies repetitive tasks and supports improvements through digital tools.",
                        keywords: /automation|automate|workflow|repetitive|digital|process|software/,
                        skills: ["Workflow Automation Awareness", "Digital Tools and Technology", "Process and Operations Management", "Problem Solving"]
                    },
                    {
                        title: "Finance Administration Associate",
                        description: "Supports billing, invoices, payment records and financial documentation.",
                        keywords: /finance|account|invoice|billing|payment|budget|expense/,
                        skills: ["Financial Administration", "Documentation and Records Management", "Reporting and Data Handling", "Time Management"]
                    },
                    {
                        title: "Inventory and Logistics Coordinator",
                        description: "Coordinates stock records, supplies, orders and logistics activities.",
                        keywords: /inventory|stock|warehouse|logistics|dispatch|supplies|orders/,
                        skills: ["Inventory Management", "Planning and Task Management", "Documentation and Records Management", "Stakeholder Communication"]
                    },
                    {
                        title: "Compliance Coordinator",
                        description: "Supports policy documentation, audit preparation and compliance tracking.",
                        keywords: /compliance|policy|audit|quality|standards|documentation/,
                        skills: ["Documentation and Records Management", "Problem Solving", "Planning and Task Management", "Stakeholder Communication"]
                    },
                    {
                        title: "Quality Assurance Coordinator",
                        description: "Monitors process quality, checks records and supports continuous improvement.",
                        keywords: /quality|accuracy|process|audit|check|verify|improvement/,
                        skills: ["Process and Operations Management", "Problem Solving", "Documentation and Records Management", "Reporting and Data Handling"]
                    },
                    {
                        title: "Digital Operations Associate",
                        description: "Supports digital tools, business systems and technology-enabled workflows.",
                        keywords: /digital|software|technology|system|automation|application|computer/,
                        skills: ["Digital Tools and Technology", "Workflow Automation Awareness", "Process and Operations Management", "Problem Solving"]
                    },
                    {
                        title: "Recruitment Coordinator",
                        description: "Coordinates candidate communication, interview schedules and recruitment records.",
                        keywords: /recruit|candidate|interview|hiring|talent|employee/,
                        skills: ["Human Resource Administration", "Scheduling and Coordination", "Stakeholder Communication", "Documentation and Records Management"]
                    }
                ];

                var aSkillAliases = {
                    "documentation and records management": [
                        "documentation", "document management", "records management",
                        "filing", "data entry", "record keeping"
                    ],
                    "scheduling and coordination": [
                        "scheduling", "calendar management", "meeting coordination",
                        "appointment scheduling", "coordination"
                    ],
                    "reporting and data handling": [
                        "reporting", "mis reporting", "excel", "microsoft excel",
                        "spreadsheet management", "data reporting", "power bi",
                        "tableau", "data analysis", "dashboard creation", "sql", "mysql"
                    ],
                    "stakeholder communication": [
                        "communication", "business communication", "teamwork",
                        "vendor communication", "customer communication",
                        "client support", "interpersonal skills"
                    ],
                    "planning and task management": [
                        "planning", "task management", "time management",
                        "project coordination", "prioritisation", "organisation skills"
                    ],
                    "process and operations management": [
                        "operations management", "workflow management",
                        "process improvement", "business process knowledge",
                        "process mapping", "workflow automation"
                    ],
                    "problem solving": [
                        "critical thinking", "analytical thinking",
                        "decision making", "troubleshooting"
                    ],
                    "time management": [
                        "deadline management", "task management", "planning"
                    ],
                    "financial administration": [
                        "basic accounting", "bookkeeping", "invoice processing",
                        "billing", "expense tracking", "financial reporting",
                        "accounts payable", "accounts receivable"
                    ],
                    "human resource administration": [
                        "human resources administration", "hr documentation",
                        "employee records management", "attendance management",
                        "leave management", "recruitment support",
                        "employee onboarding", "payroll coordination"
                    ],
                    "customer service": [
                        "customer support", "customer query resolution",
                        "complaint handling", "client support",
                        "customer relationship management"
                    ],
                    "inventory management": [
                        "inventory tracking", "stock management",
                        "supply chain basics", "logistics coordination"
                    ],
                    "digital tools and technology": [
                        "digital literacy", "microsoft 365", "google workspace",
                        "sap", "erp systems", "crm software", "python",
                        "mysql", "sql", "power bi", "tableau"
                    ],
                    "workflow automation awareness": [
                        "workflow automation", "process automation",
                        "automation", "no-code tools", "low-code tools"
                    ]
                };

                function normalise(sValue) {
                    return (sValue || "")
                        .toLowerCase()
                        .replace(/[^a-z0-9 ]/g, " ")
                        .replace(/\s+/g, " ")
                        .trim();
                }

                function hasSkill(sRequired) {
                    var sRequiredKey = normalise(sRequired);
                    var aAliases = aSkillAliases[sRequiredKey] || [];

                    return aSkills.some(function (sUserSkill) {
                        var sUserKey = normalise(sUserSkill);

                        return (
                            sUserKey === sRequiredKey ||
                            aAliases.some(function (sAlias) {
                                return sUserKey === normalise(sAlias);
                            })
                        );
                    });
                }

                var aRankedRoles = aCareerRoles.map(function (oRole) {
                    var aMatched = [];
                    var aMissing = [];

                    oRole.skills.forEach(function (sRequired) {
                        if (hasSkill(sRequired)) {
                            aMatched.push(sRequired);
                        } else {
                            aMissing.push(sRequired);
                        }
                    });

                    var bContextMatch = oRole.keywords.test(sProfileText);

                    var nSkillScore = (
                        aMatched.length / oRole.skills.length
                    ) * 80;

                    var nContextScore = bContextMatch ? 20 : 0;
                    var nExperienceScore = Math.min(nExperience, 5);

                    var nScore = Math.min(
                        100,
                        Math.round(
                            nSkillScore + nContextScore + nExperienceScore
                        )
                    );

                    return {
                        role: oRole,
                        matched: aMatched,
                        missing: aMissing,
                        score: nScore,
                        contextMatch: bContextMatch
                    };
                });

                aRankedRoles.sort(function (a, b) {
                    return b.score - a.score;
                });

                var aRecommendations = aRankedRoles.filter(function (oItem) {
                    return (
                        oItem.matched.length > 0 ||
                        oItem.contextMatch
                    );
                }).slice(0, 8);

                var aContent = [];

                aContent.push(this._sectionText(
                    "Discover career possibilities beyond your current job title. Recommendations are based on your saved skills, work responsibilities and experience."
                ));

                aContent.push(this._sectionTitle("Your Career Snapshot"));

                aContent.push(new VBox({
                    width: "100%",
                    items: [
                        new Text({
                            text: "Current role: " + (sCurrentRole || "Not specified"),
                            wrapping: true
                        }),
                        new Text({
                            text: "Experience: " + nExperience + " years",
                            wrapping: true
                        }),
                        new Text({
                            text: "Skills in profile: " +
                                (aSkills.join(", ") || "Not added yet."),
                            wrapping: true
                        })
                    ]
                }).addStyleClass("sapUiSmallMarginBottom"));

                aContent.push(this._sectionTitle(
                    "Career Pathways Recommended for You"
                ));

                if (!aRecommendations.length) {
                    aContent.push(new Text({
                        text: "We could not find a strong role match yet. Add more details about your responsibilities or discover additional transferable skills.",
                        wrapping: true
                    }));
                } else {
                    aRecommendations.forEach(function (oItem, i) {
                        var oRole = oItem.role;

                        var oScore = new ProgressIndicator({
                            percentValue: oItem.score,
                            displayValue: oItem.score + "% profile match",
                            state: oItem.score >= 70
                                ? "Success"
                                : (oItem.score >= 40 ? "Information" : "None"),
                            width: "100%"
                        });

                        var oSelectButton = new Button({
                            text: oModel.getProperty("/targetRole") === oRole.title
                                ? "Currently Selected"
                                : "Choose This Career Path",
                            type: "Emphasized",
                            enabled: oModel.getProperty("/targetRole") !== oRole.title,
                            width: "100%",

                            press: async function () {
                                var oPayload = {
                                    ID: oModel.getProperty("/profileID") || undefined,
                                    name: oModel.getProperty("/name") || "Your Name",
                                    email: oModel.getProperty("/email") || null,
                                    currentRole: sCurrentRole,
                                    yearsExperience: nExperience,
                                    skills: aSkills.join(", "),
                                    workExperience: sWork,
                                    targetRole: oRole.title,
                                    completedActivities: JSON.stringify(
                                        oModel.getProperty("/completedActivities") || []
                                    ),
                                    learningProgress: (
                                        oModel.getProperty("/completedActivities") || []
                                    ).length
                                };

                                oSelectButton.setEnabled(false);
                                oSelectButton.setText("Saving...");

                                try {
                                    var sID = await oController._saveProfileToBackend(oPayload);

                                    oModel.setProperty("/profileID", sID || oPayload.ID || "");
                                    oModel.setProperty("/targetRole", oRole.title);

                                    MessageBox.success(
                                        oRole.title +
                                        " has been saved as your target career."
                                    );

                                    oController._oActiveDialog.close();

                                } catch (oError) {
                                    MessageBox.error(
                                        "Could not save your target role.\n\n" +
                                        oError.message
                                    );

                                    oSelectButton.setEnabled(true);
                                    oSelectButton.setText("Choose This Career Path");
                                }
                            }
                        });

                        aContent.push(new VBox({
                            width: "100%",
                            items: [
                                new Title({
                                    text: (i + 1) + ". " + oRole.title,
                                    level: "H3"
                                }),

                                new Text({
                                    text: oRole.description,
                                    wrapping: true
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                oScore,

                                new Text({
                                    text: "Your matching capabilities",
                                    wrapping: true
                                }).addStyleClass("sapUiSmallMarginTop"),

                                new Text({
                                    text: oItem.matched.join(", ") ||
                                        "No direct skill matches yet.",
                                    wrapping: true
                                }),

                                new Text({
                                    text: "Skills to develop for this role",
                                    wrapping: true
                                }).addStyleClass("sapUiSmallMarginTop"),

                                new Text({
                                    text: oItem.missing.join(", ") ||
                                        "You meet the basic listed skill requirements. Explore advanced skills in your learning pathway.",
                                    wrapping: true
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                oSelectButton
                            ]
                        }).addStyleClass(
                            "sapUiMediumMarginTop sapUiMediumMarginBottom sapUiSmallMarginBeginEnd"
                        ));
                    });
                }

                aContent.push(new Text({
                    text: "Important: These are illustrative career pathways, not live vacancies. Match scores are prototype estimates based on profile skills, work context and experience. They are not hiring predictions or guaranteed job outcomes.",
                    wrapping: true
                }).addStyleClass("sapUiMediumMarginTop"));

                this._showDialog("Market Intelligence | Career Opportunities", aContent);
            },

            // -------------------------------------------------
            // STEP 4: PERSONALIZED LEARNING PATHWAY
            // -------------------------------------------------

            onNavLearning: function () {
                var oController = this;
                var oModel = this.getView().getModel("user");
                var sTargetRole = oModel.getProperty("/targetRole") || "";
                var aSkills = oModel.getProperty("/skills") || [];
                var aContent = [];

                if (!sTargetRole) {
                    this._showDialog("Learning Pathway", [
                        this._sectionText(
                            "Select a target role in Market Intelligence first. Career Orchestrator will then prepare a learning pathway based on the selected career direction."
                        ),
                        new Button({
                            text: "Explore Career Roles",
                            type: "Emphasized",
                            press: function () {
                                oController._oActiveDialog.close();
                                oController.onNavMarket();
                            }
                        })
                    ]);
                    return;
                }

                var aRoleRequirements = {
                    "Operations Coordinator": {
                        required: [
                            "Scheduling and Coordination",
                            "Documentation and Records Management",
                            "Process and Operations Management"
                        ],
                        additional: [
                            "Process Mapping",
                            "Advanced Excel",
                            "Power BI Fundamentals",
                            "Workflow Automation"
                        ]
                    },

                    "Project Coordinator": {
                        required: [
                            "Scheduling and Coordination",
                            "Stakeholder Communication",
                            "Planning and Task Management",
                            "Reporting and Data Handling"
                        ],
                        additional: [
                            "Project Management Tools",
                            "Risk Tracking",
                            "Advanced Excel",
                            "Agile Fundamentals"
                        ]
                    },

                    "HR Operations Associate": {
                        required: [
                            "Documentation and Records Management",
                            "Scheduling and Coordination",
                            "Stakeholder Communication"
                        ],
                        additional: [
                            "HR Management Systems",
                            "Employee Onboarding",
                            "HR Analytics",
                            "Advanced Excel"
                        ]
                    },

                    "Operations Analyst": {
                        required: [
                            "Reporting and Data Handling",
                            "Process and Operations Management",
                            "Documentation and Records Management"
                        ],
                        additional: [
                            "Advanced Excel",
                            "Power BI",
                            "SQL",
                            "Data Visualization",
                            "Process Analysis"
                        ]
                    },

                    "Administrative Services Specialist": {
                        required: [
                            "Documentation and Records Management",
                            "Planning and Task Management",
                            "Stakeholder Communication"
                        ],
                        additional: [
                            "Advanced Excel",
                            "Digital Records Systems",
                            "Workflow Automation",
                            "Business Communication"
                        ]
                    },

                    "Customer Success Associate": {
                        required: [
                            "Customer Service",
                            "Stakeholder Communication",
                            "Problem Solving"
                        ],
                        additional: [
                            "CRM Software",
                            "Customer Relationship Management",
                            "Customer Data Analysis",
                            "Presentation Skills"
                        ]
                    },

                    "Procurement Coordinator": {
                        required: [
                            "Stakeholder Communication",
                            "Documentation and Records Management",
                            "Financial Administration"
                        ],
                        additional: [
                            "Procurement Software",
                            "Advanced Excel",
                            "Vendor Management",
                            "Supply Chain Basics"
                        ]
                    },

                    "Reporting and MIS Executive": {
                        required: [
                            "Reporting and Data Handling",
                            "Digital Tools and Technology",
                            "Documentation and Records Management"
                        ],
                        additional: [
                            "Advanced Excel",
                            "Power BI",
                            "SQL",
                            "Dashboard Development",
                            "Data Visualization"
                        ]
                    },

                    "Business Support Analyst": {
                        required: [
                            "Process and Operations Management",
                            "Reporting and Data Handling",
                            "Problem Solving"
                        ],
                        additional: [
                            "Business Analysis",
                            "Advanced Excel",
                            "Power BI",
                            "SQL",
                            "Process Mapping"
                        ]
                    },

                    "Training and Learning Coordinator": {
                        required: [
                            "Scheduling and Coordination",
                            "Stakeholder Communication",
                            "Planning and Task Management"
                        ],
                        additional: [
                            "Learning Management Systems",
                            "Training Evaluation",
                            "Presentation Skills",
                            "Digital Learning Tools"
                        ]
                    },

                    "Data Management Associate": {
                        required: [
                            "Documentation and Records Management",
                            "Reporting and Data Handling",
                            "Digital Tools and Technology"
                        ],
                        additional: [
                            "SQL",
                            "Data Cleaning",
                            "Database Management",
                            "Data Quality",
                            "Advanced Excel"
                        ]
                    },

                    "Workflow Automation Coordinator": {
                        required: [
                            "Workflow Automation Awareness",
                            "Digital Tools and Technology",
                            "Process and Operations Management"
                        ],
                        additional: [
                            "Power Automate",
                            "Process Mapping",
                            "No-Code Tools",
                            "AI Literacy",
                            "Workflow Design"
                        ]
                    },

                    "Finance Administration Associate": {
                        required: [
                            "Financial Administration",
                            "Documentation and Records Management",
                            "Reporting and Data Handling"
                        ],
                        additional: [
                            "Advanced Excel",
                            "Accounting Software",
                            "Financial Analysis",
                            "Budget Monitoring"
                        ]
                    },

                    "Inventory and Logistics Coordinator": {
                        required: [
                            "Inventory Management",
                            "Planning and Task Management",
                            "Documentation and Records Management"
                        ],
                        additional: [
                            "Inventory Software",
                            "Supply Chain Management",
                            "Advanced Excel",
                            "Logistics Analytics"
                        ]
                    },

                    "Compliance Coordinator": {
                        required: [
                            "Documentation and Records Management",
                            "Problem Solving",
                            "Planning and Task Management"
                        ],
                        additional: [
                            "Risk Management",
                            "Audit Documentation",
                            "Compliance Monitoring",
                            "Data Privacy Awareness"
                        ]
                    },

                    "Quality Assurance Coordinator": {
                        required: [
                            "Process and Operations Management",
                            "Problem Solving",
                            "Documentation and Records Management"
                        ],
                        additional: [
                            "Quality Management",
                            "Process Improvement",
                            "Data Analysis",
                            "Root Cause Analysis"
                        ]
                    },

                    "Digital Operations Associate": {
                        required: [
                            "Digital Tools and Technology",
                            "Workflow Automation Awareness",
                            "Process and Operations Management"
                        ],
                        additional: [
                            "AI Literacy",
                            "Power Automate",
                            "ERP Systems",
                            "Data Analysis",
                            "Digital Process Design"
                        ]
                    },

                    "Recruitment Coordinator": {
                        required: [
                            "Human Resource Administration",
                            "Scheduling and Coordination",
                            "Stakeholder Communication"
                        ],
                        additional: [
                            "Applicant Tracking Systems",
                            "Recruitment Analytics",
                            "Interview Coordination",
                            "HR Management Systems"
                        ]
                    }
                };

                var oLearningResources = {
                    "Scheduling and Coordination": {
                        course: "Workplace Scheduling and Coordination",
                        resource: "Learn calendar management, meeting coordination and task scheduling.",
                        task: "Prepare a weekly work schedule for a small team."
                    },
                    "Documentation and Records Management": {
                        course: "Digital Documentation and Records Management",
                        resource: "Learn digital filing, document organisation and record maintenance.",
                        task: "Create an organised digital record system for employee documents."
                    },
                    "Process and Operations Management": {
                        course: "Operations and Workflow Management",
                        resource: "Learn to document workflows and identify process improvements.",
                        task: "Create a simple workflow diagram for an administrative process."
                    },
                    "Stakeholder Communication": {
                        course: "Professional Communication Skills",
                        resource: "Learn workplace communication, email writing and stakeholder coordination.",
                        task: "Draft a professional project update email."
                    },
                    "Planning and Task Management": {
                        course: "Project Planning Fundamentals",
                        resource: "Learn task prioritisation, project timelines and progress tracking.",
                        task: "Prepare a simple project task tracker."
                    },
                    "Reporting and Data Handling": {
                        course: "Excel for Data Reporting",
                        resource: "Learn spreadsheet formulas, sorting, filtering and pivot tables.",
                        task: "Create a monthly performance report using sample data."
                    },
                    "Process Mapping": {
                        course: "Business Process Mapping",
                        resource: "Learn to represent business processes using flowcharts.",
                        task: "Map the steps involved in processing an office request."
                    },
                    "Advanced Excel": {
                        course: "Advanced Excel for the Workplace",
                        resource: "Practise formulas, lookup functions and pivot tables.",
                        task: "Analyse a sample employee attendance spreadsheet."
                    },
                    "Project Management Tools": {
                        course: "Introduction to Project Management Tools",
                        resource: "Learn task boards, project timelines and progress monitoring.",
                        task: "Create a sample project task board."
                    },
                    "Risk Tracking": {
                        course: "Project Risk Management Basics",
                        resource: "Learn to identify, record and monitor project risks.",
                        task: "Prepare a basic project risk register."
                    },
                    "HR Management Systems": {
                        course: "Introduction to HR Management Systems",
                        resource: "Understand digital employee records and HR information systems.",
                        task: "Design a sample employee information tracker."
                    },
                    "Employee Onboarding": {
                        course: "Employee Onboarding Fundamentals",
                        resource: "Learn the steps involved in welcoming and supporting new employees.",
                        task: "Prepare a new employee onboarding checklist."
                    },
                    "Power BI": {
                        course: "Power BI Fundamentals",
                        resource: "Learn data import, visualisation and dashboard creation.",
                        task: "Build a simple employee or operations dashboard."
                    },
                    "Data Analysis": {
                        course: "Introduction to Data Analysis",
                        resource: "Practise data cleaning, analysis and interpretation.",
                        task: "Analyse a sample operations dataset and write three findings."
                    },
                    "SQL": {
                        course: "SQL Fundamentals",
                        resource: "Learn to retrieve, filter and organise information from databases.",
                        task: "Write basic SQL queries using a sample employee database."
                    },
                    "Data Visualization": {
                        course: "Data Visualization Fundamentals",
                        resource: "Learn to communicate information through charts and dashboards.",
                        task: "Create three charts from a sample business dataset."
                    },
                    "Workflow Automation": {
                        course: "Introduction to Workflow Automation",
                        resource: "Understand how repetitive business tasks can be automated.",
                        task: "Design an automated approval workflow for an office request."
                    },
                    "AI Literacy": {
                        course: "AI Literacy for the Workplace",
                        resource: "Learn AI fundamentals, responsible use and practical workplace applications.",
                        task: "Identify three administrative tasks where AI could assist a worker."
                    },
                    "Power Automate": {
                        course: "Microsoft Power Automate Fundamentals",
                        resource: "Learn how to create simple automated workflows.",
                        task: "Design a workflow for sending an automatic task reminder."
                    },
                    "Business Analysis": {
                        course: "Business Analysis Fundamentals",
                        resource: "Learn to understand business needs and document requirements.",
                        task: "Prepare a simple requirements document for an office process."
                    },
                    "Customer Relationship Management": {
                        course: "CRM Fundamentals",
                        resource: "Learn customer records, interaction tracking and relationship management.",
                        task: "Design a sample customer interaction tracker."
                    },
                    "CRM Software": {
                        course: "Introduction to CRM Software",
                        resource: "Understand how organisations manage customer interactions digitally.",
                        task: "Create a sample customer follow-up record."
                    },
                    "Database Management": {
                        course: "Database Management Basics",
                        resource: "Learn database tables, records and data organisation.",
                        task: "Design a simple database table for employee records."
                    },
                    "Data Cleaning": {
                        course: "Data Cleaning Fundamentals",
                        resource: "Learn to identify duplicates, missing values and inconsistent data.",
                        task: "Clean a sample spreadsheet and document the changes."
                    },
                    "Process Improvement": {
                        course: "Process Improvement Fundamentals",
                        resource: "Learn to identify bottlenecks and improve existing workflows.",
                        task: "Suggest three improvements to an administrative workflow."
                    }
                };

                var oRequirements = aRoleRequirements[sTargetRole];

                if (!oRequirements) {
                    oRequirements = {
                        required: [
                            "Documentation and Records Management",
                            "Stakeholder Communication",
                            "Planning and Task Management"
                        ],
                        additional: [
                            "Advanced Excel",
                            "Power BI",
                            "AI Literacy",
                            "Workflow Automation"
                        ]
                    };
                }

                function hasUserSkill(sSkill) {
                    return aSkills.some(function (sExisting) {
                        return sExisting.toLowerCase() === sSkill.toLowerCase();
                    });
                }

                var aMissing = oRequirements.required.filter(function (s) {
                    return !hasUserSkill(s);
                });

                var aAdditional = oRequirements.additional.filter(function (s) {
                    return !hasUserSkill(s);
                });

                // Additional development skills are retained even if
                // all basic requirements are already satisfied.
                var aLearningSkills = aMissing.concat(aAdditional);

                var aCompleted = (
                    oModel.getProperty("/completedActivities") || []
                ).slice();

                var aCheckBoxes = [];

                aContent.push(this._sectionText(
                    "A personalised development plan designed around your chosen career direction. Complete practical learning activities to build evidence of your capabilities."
                ));

                aContent.push(this._sectionTitle("Your Learning Goal"));

                aContent.push(new VBox({
                    width: "100%",
                    items: [
                        new Title({
                            text: sTargetRole,
                            level: "H2"
                        }),
                        new Text({
                            text: "Your current skills: " +
                                (aSkills.join(", ") || "No skills added yet."),
                            wrapping: true
                        })
                    ]
                }).addStyleClass("sapUiSmallMarginBottom"));

                aContent.push(this._sectionTitle("Your Skill Development Priorities"));

                if (aMissing.length) {
                    aContent.push(new Text({
                        text: "Core skills to strengthen: " + aMissing.join(", "),
                        wrapping: true
                    }).addStyleClass("sapUiSmallMarginBottom"));
                } else {
                    aContent.push(new Text({
                        text: "You already meet the basic skill requirements in this sample role profile. Your next step is to build advanced capabilities that can improve your readiness for the role.",
                        wrapping: true
                    }).addStyleClass("sapUiSmallMarginBottom"));
                }

                aContent.push(new Text({
                    text: "Additional skills for career growth: " +
                        (aAdditional.join(", ") || "Continue practising advanced workplace tasks."),
                    wrapping: true
                }).addStyleClass("sapUiSmallMarginBottom"));

                aLearningSkills.forEach(function (sSkill, i) {
                    var oResource = oLearningResources[sSkill];

                    if (!oResource) {
                        oResource = {
                            course: "Introduction to " + sSkill,
                            resource: "Build practical knowledge and confidence in " + sSkill + ".",
                            task: "Complete a small practical activity demonstrating " + sSkill + "."
                        };
                    }

                    var oCheckBox = new CheckBox({
                        text: "Mark this learning activity as completed",
                        selected: aCompleted.indexOf(sSkill) !== -1
                    });

                    aCheckBoxes.push({
                        skill: sSkill,
                        checkbox: oCheckBox
                    });

                    aContent.push(new VBox({
                        width: "100%",
                        items: [
                            new Title({
                                text: (i + 1) + ". " + sSkill,
                                level: "H3"
                            }),
                            new Text({
                                text: "Suggested learning: " + oResource.course,
                                wrapping: true
                            }),
                            new Text({
                                text: "What to learn: " + oResource.resource,
                                wrapping: true
                            }),
                            new Text({
                                text: "Practical task: " + oResource.task,
                                wrapping: true
                            }).addStyleClass("sapUiSmallMarginBottom"),
                            oCheckBox
                        ]
                    }).addStyleClass(
                        "sapUiMediumMarginTop sapUiMediumMarginBottom"
                    ));
                });

                var oProgressText = new Text({
                    text: "",
                    wrapping: true
                }).addStyleClass("sapUiSmallMarginTop");

                var oProgressBar = new ProgressIndicator({
                    percentValue: 0,
                    displayValue: "0% completed",
                    width: "100%"
                });

                function updateProgressText() {
                    var nCompleted = aCheckBoxes.filter(function (oItem) {
                        return oItem.checkbox.getSelected();
                    }).length;

                    var nTotal = aCheckBoxes.length;
                    var nPercent = nTotal
                        ? Math.round((nCompleted / nTotal) * 100)
                        : 100;

                    oProgressText.setText(
                        "Completed activities: " + nCompleted + " / " + nTotal
                    );

                    oProgressBar.setPercentValue(nPercent);
                    oProgressBar.setDisplayValue(nPercent + "% completed");
                }

                updateProgressText();

                aCheckBoxes.forEach(function (oItem) {
                    oItem.checkbox.attachSelect(async function (oEvent) {
                        var bSelected = oEvent.getParameter("selected");
                        var aOldCompleted = (
                            oModel.getProperty("/completedActivities") || []
                        ).slice();

                        var aNewCompleted = aOldCompleted.filter(function (s) {
                            return s !== oItem.skill;
                        });

                        if (bSelected) {
                            aNewCompleted.push(oItem.skill);
                        }

                        aCheckBoxes.forEach(function (oCheck) {
                            oCheck.checkbox.setEnabled(false);
                        });

                        try {
                            await oController._saveLearningProgress(aNewCompleted);
                            updateProgressText();

                            if (bSelected) {
                                MessageBox.confirm(
                                    "You marked \"" + oItem.skill +
                                    "\" as completed.\n\nWould you like to add this skill to your profile?",
                                    {
                                        title: "Update Your Skills Profile",
                                        actions: [
                                            MessageBox.Action.YES,
                                            MessageBox.Action.NO
                                        ],
                                        emphasizedAction: MessageBox.Action.YES,

                                        onClose: async function (sAction) {
                                            if (sAction !== MessageBox.Action.YES) {
                                                MessageToast.show(
                                                    "Activity saved. The skill was not added to your profile."
                                                );
                                                return;
                                            }

                                            try {
                                                await oController._addApprovedSkill(oItem.skill);

                                                MessageBox.success(
                                                    "\"" + oItem.skill +
                                                    "\" has been added to your profile."
                                                );

                                            } catch (oError) {
                                                MessageBox.error(
                                                    "The activity is saved as completed, but the skill could not be added to your profile.\n\n" +
                                                    oError.message
                                                );
                                            }
                                        }
                                    }
                                );
                            } else {
                                MessageToast.show(
                                    "Learning activity marked as incomplete."
                                );
                            }

                        } catch (oError) {
                            oItem.checkbox.setSelected(!bSelected);
                            updateProgressText();

                            MessageBox.error(
                                "Could not save your learning progress.\n\n" +
                                oError.message
                            );

                        } finally {
                            aCheckBoxes.forEach(function (oCheck) {
                                oCheck.checkbox.setEnabled(true);
                            });
                        }
                    });
                });

                aContent.push(this._sectionTitle("Your Learning Progress"));
                aContent.push(oProgressBar);
                aContent.push(oProgressText);

                aContent.push(new Text({
                    text: "Your completed activities are saved to the SAP CAP backend. You decide whether each completed activity should also become a skill in your profile.",
                    wrapping: true
                }).addStyleClass("sapUiMediumMarginTop"));

                this._showDialog("Learning Pathway | Career Development", aContent);
            },

            // -------------------------------------------------
            // OPPORTUNITY MATCHING
            // -------------------------------------------------

                        // -------------------------------------------------
            // OPPORTUNITY MATCHING - PERSONALIZED RECOMMENDATIONS
            // -------------------------------------------------

            onNavMatching: function () {
                var oController = this;
                var oModel = this.getView().getModel("user");

                var aSkills = oModel.getProperty("/skills") || [];
                var sCurrentRole = oModel.getProperty("/currentRole") || "";
                var sWork = oModel.getProperty("/workExperience") || "";
                var sTargetRole = oModel.getProperty("/targetRole") || "";
                var nExperience = Number(
                    oModel.getProperty("/experience")
                ) || 0;

                var sProfile = (
                    sCurrentRole + " " +
                    sWork + " " +
                    aSkills.join(" ")
                ).toLowerCase();

                if (!aSkills.length && !sWork.trim()) {
                    this._showDialog("Opportunity Matching", [
                        this._sectionText(
                            "Complete your profile and describe your work experience first. Opportunity Matching uses your transferable skills and responsibilities to identify suitable career directions."
                        ),
                        new Button({
                            text: "Go to Skills Discovery",
                            type: "Emphasized",
                            press: function () {
                                oController._oActiveDialog.close();
                                oController.onNavSkills();
                            }
                        })
                    ]);
                    return;
                }

                var aOpportunities = [
                    {
                        title: "Project Coordinator",
                        description: "Supports project schedules, team coordination and progress tracking.",
                        keywords: /project|meeting|deadline|milestone|planning|coordination/,
                        skills: [
                            "Scheduling and Coordination",
                            "Stakeholder Communication",
                            "Planning and Task Management",
                            "Reporting and Data Handling"
                        ],
                        explanation: "Your coordination, scheduling and task-management experience can transfer to project support."
                    },
                    {
                        title: "Operations Coordinator",
                        description: "Coordinates daily business activities and improves administrative workflows.",
                        keywords: /operation|office|administrat|process|workflow|coordination/,
                        skills: [
                            "Scheduling and Coordination",
                            "Documentation and Records Management",
                            "Process and Operations Management",
                            "Planning and Task Management"
                        ],
                        explanation: "Your administrative and operational responsibilities can support daily business operations."
                    },
                    {
                        title: "Operations Analyst",
                        description: "Uses business data and reports to understand and improve operational performance.",
                        keywords: /data|report|excel|spreadsheet|analysis|operation|dashboard/,
                        skills: [
                            "Reporting and Data Handling",
                            "Process and Operations Management",
                            "Documentation and Records Management",
                            "Problem Solving"
                        ],
                        explanation: "Your reporting and process experience can provide a starting point for analytical work."
                    },
                    {
                        title: "HR Operations Associate",
                        description: "Supports employee records, attendance, onboarding and HR administration.",
                        keywords: /employee|attendance|payroll|recruit|onboard|leave|staff|human resource/,
                        skills: [
                            "Human Resource Administration",
                            "Documentation and Records Management",
                            "Scheduling and Coordination",
                            "Stakeholder Communication"
                        ],
                        explanation: "Your employee coordination and record-management responsibilities can transfer to HR operations."
                    },
                    {
                        title: "Reporting and MIS Executive",
                        description: "Prepares reports, maintains spreadsheets and tracks business performance.",
                        keywords: /report|excel|spreadsheet|data|mis|dashboard|statistics/,
                        skills: [
                            "Reporting and Data Handling",
                            "Digital Tools and Technology",
                            "Documentation and Records Management",
                            "Problem Solving"
                        ],
                        explanation: "Your reporting and information-handling experience can support business reporting responsibilities."
                    },
                    {
                        title: "Administrative Services Specialist",
                        description: "Manages office documentation, records and administrative services.",
                        keywords: /administrat|office|document|record|filing|correspondence/,
                        skills: [
                            "Documentation and Records Management",
                            "Planning and Task Management",
                            "Stakeholder Communication",
                            "Time Management"
                        ],
                        explanation: "Your existing administrative experience is closely related to this career direction."
                    },
                    {
                        title: "Customer Success Associate",
                        description: "Supports customers, resolves queries and maintains client relationships.",
                        keywords: /customer|client|support|complaint|service|queries/,
                        skills: [
                            "Customer Service",
                            "Stakeholder Communication",
                            "Problem Solving",
                            "Documentation and Records Management"
                        ],
                        explanation: "Your communication and customer-support responsibilities can transfer to customer success."
                    },
                    {
                        title: "Procurement Coordinator",
                        description: "Coordinates suppliers, purchase requests and procurement documentation.",
                        keywords: /vendor|supplier|purchase|procurement|invoice|stock/,
                        skills: [
                            "Stakeholder Communication",
                            "Documentation and Records Management",
                            "Financial Administration",
                            "Planning and Task Management"
                        ],
                        explanation: "Your documentation and coordination experience can support procurement activities."
                    },
                    {
                        title: "Business Support Analyst",
                        description: "Supports business teams through process documentation and information analysis.",
                        keywords: /business|process|data|report|workflow|analysis/,
                        skills: [
                            "Process and Operations Management",
                            "Reporting and Data Handling",
                            "Problem Solving",
                            "Stakeholder Communication"
                        ],
                        explanation: "Your process knowledge and reporting experience can support business analysis work."
                    },
                    {
                        title: "Training and Learning Coordinator",
                        description: "Coordinates employee training schedules and learning activities.",
                        keywords: /training|learning|education|employee|schedule|development/,
                        skills: [
                            "Scheduling and Coordination",
                            "Stakeholder Communication",
                            "Planning and Task Management",
                            "Documentation and Records Management"
                        ],
                        explanation: "Your scheduling and people-coordination experience can transfer to training coordination."
                    },
                    {
                        title: "Data Management Associate",
                        description: "Maintains digital records and supports data quality and organisation.",
                        keywords: /data|database|record|document|spreadsheet|digital/,
                        skills: [
                            "Documentation and Records Management",
                            "Reporting and Data Handling",
                            "Digital Tools and Technology",
                            "Problem Solving"
                        ],
                        explanation: "Your record-management and information-handling experience can support data management."
                    },
                    {
                        title: "Workflow Automation Coordinator",
                        description: "Identifies repetitive tasks and supports digital workflow improvements.",
                        keywords: /automation|automate|workflow|repetitive|digital|process|software/,
                        skills: [
                            "Workflow Automation Awareness",
                            "Digital Tools and Technology",
                            "Process and Operations Management",
                            "Problem Solving"
                        ],
                        explanation: "Your process knowledge can help you identify tasks that could be improved through automation."
                    }
                ];

                function normalise(sValue) {
                    return (sValue || "")
                        .toLowerCase()
                        .replace(/[^a-z0-9 ]/g, " ")
                        .replace(/\s+/g, " ")
                        .trim();
                }

                var aAliases = {
                    "documentation and records management": [
                        "documentation", "document management",
                        "records management", "filing",
                        "data entry", "record keeping"
                    ],
                    "scheduling and coordination": [
                        "scheduling", "calendar management",
                        "meeting coordination", "appointment scheduling",
                        "coordination"
                    ],
                    "reporting and data handling": [
                        "reporting", "mis reporting", "excel",
                        "microsoft excel", "spreadsheet management",
                        "data reporting", "power bi", "tableau",
                        "data analysis", "dashboard creation"
                    ],
                    "stakeholder communication": [
                        "communication", "business communication",
                        "teamwork", "vendor communication",
                        "customer communication", "interpersonal skills"
                    ],
                    "planning and task management": [
                        "planning", "task management", "time management",
                        "project coordination", "prioritisation",
                        "organisation skills"
                    ],
                    "process and operations management": [
                        "operations management", "workflow management",
                        "process improvement", "business process knowledge",
                        "process mapping"
                    ],
                    "human resource administration": [
                        "human resources administration", "hr documentation",
                        "employee records management", "attendance management",
                        "leave management", "recruitment support",
                        "employee onboarding"
                    ],
                    "digital tools and technology": [
                        "digital literacy", "microsoft 365",
                        "google workspace", "sap", "erp systems",
                        "crm software", "python", "sql", "mysql",
                        "power bi", "tableau"
                    ],
                    "problem solving": [
                        "critical thinking", "analytical thinking",
                        "decision making", "troubleshooting"
                    ],
                    "customer service": [
                        "customer support", "customer query resolution",
                        "complaint handling", "client support"
                    ],
                    "time management": [
                        "deadline management", "task management", "planning"
                    ]
                };

                function hasSkill(sRequired) {
                    var sRequiredKey = normalise(sRequired);
                    var aSkillAliases = aAliases[sRequiredKey] || [];

                    return aSkills.some(function (sUserSkill) {
                        var sUserKey = normalise(sUserSkill);

                        return (
                            sUserKey === sRequiredKey ||
                            aSkillAliases.some(function (sAlias) {
                                return sUserKey === normalise(sAlias);
                            })
                        );
                    });
                }

                var aRanked = aOpportunities.map(function (oOpportunity) {
                    var aMatched = [];
                    var aMissing = [];

                    oOpportunity.skills.forEach(function (sSkill) {
                        if (hasSkill(sSkill)) {
                            aMatched.push(sSkill);
                        } else {
                            aMissing.push(sSkill);
                        }
                    });

                    var bContextMatch =
                        oOpportunity.keywords.test(sProfile);

                    // Score is based on confirmed listed skill matches.
                    // Context adds a small relevance bonus.
                    // Experience is not treated as a confirmed skill.
                    var nSkillScore = Math.round(
                        (aMatched.length / oOpportunity.skills.length) * 85
                    );

                    var nContextScore = bContextMatch ? 15 : 0;

                    var nScore = Math.min(
                        100,
                        nSkillScore + nContextScore
                    );

                    return {
                        opportunity: oOpportunity,
                        matched: aMatched,
                        missing: aMissing,
                        score: nScore,
                        contextMatch: bContextMatch
                    };
                });

                aRanked.sort(function (a, b) {
                    return b.score - a.score;
                });

                var aRecommendations = aRanked.filter(function (oItem) {
                    return (
                        oItem.matched.length > 0 ||
                        oItem.contextMatch
                    );
                }).slice(0, 8);

                var aContent = [];

                aContent.push(this._sectionText(
                    "Explore career opportunities based on your actual skills and responsibilities. Each recommendation explains your existing strengths and the capabilities you can develop next."
                ));

                aContent.push(this._sectionTitle(
                    "Your Professional Snapshot"
                ));

                aContent.push(new VBox({
                    width: "100%",
                    items: [
                        new Text({
                            text: "Current role: " +
                                (sCurrentRole || "Not specified"),
                            wrapping: true
                        }),
                        new Text({
                            text: "Experience: " +
                                nExperience + " years",
                            wrapping: true
                        }),
                        new Text({
                            text: "Skills: " +
                                (aSkills.join(", ") || "None added"),
                            wrapping: true
                        }),
                        new Text({
                            text: "Current career goal: " +
                                (sTargetRole || "Not selected"),
                            wrapping: true
                        })
                    ]
                }).addStyleClass("sapUiSmallMarginBottom"));

                aContent.push(this._sectionTitle(
                    "Your Recommended Opportunities"
                ));

                if (!aRecommendations.length) {
                    aContent.push(new Text({
                        text: "We could not identify relevant opportunities from the information currently available. Add more specific responsibilities in Skills Discovery or update your skills in My Profile.",
                        wrapping: true
                    }));
                }

                aRecommendations.forEach(function (oItem, i) {
                    var oOpportunity = oItem.opportunity;

                    var oScore = new ProgressIndicator({
                        percentValue: oItem.score,
                        displayValue: oItem.score + "% illustrative profile match",
                        state: oItem.score >= 70
                            ? "Success"
                            : (oItem.score >= 40
                                ? "Information"
                                : "None"),
                        width: "100%"
                    });

                    var oMatchDetails = new VBox({
                        width: "100%",
                        items: [
                            new Text({
                                text: oItem.matched.length
                                    ? oItem.matched.join(", ")
                                    : "No direct listed skill matches yet.",
                                wrapping: true
                            })
                        ]
                    });

                    var oGapDetails = new Text({
                        text: oItem.missing.length
                            ? oItem.missing.join(", ")
                            : "You already cover the listed core skills. Consider developing advanced capabilities and practical evidence.",
                        wrapping: true
                    });

                    var oSelectButton = new Button({
                        text: sTargetRole === oOpportunity.title
                            ? "Selected as Target Opportunity"
                            : "Choose This Opportunity",
                        type: "Emphasized",
                        width: "100%",
                        enabled: sTargetRole !== oOpportunity.title,

                        press: async function () {
                            var oPayload = {
                                ID: oModel.getProperty("/profileID") || undefined,
                                name: oModel.getProperty("/name") || "Your Name",
                                email: oModel.getProperty("/email") || null,
                                currentRole: sCurrentRole,
                                yearsExperience: nExperience,
                                skills: aSkills.join(", "),
                                workExperience: sWork,
                                targetRole: oOpportunity.title,
                                completedActivities: JSON.stringify(
                                    oModel.getProperty("/completedActivities") || []
                                ),
                                learningProgress: (
                                    oModel.getProperty("/completedActivities") || []
                                ).length
                            };

                            oSelectButton.setEnabled(false);
                            oSelectButton.setText("Saving...");

                            try {
                                var sID = await oController._saveProfileToBackend(
                                    oPayload
                                );

                                oModel.setProperty(
                                    "/profileID",
                                    sID || oPayload.ID || ""
                                );

                                oModel.setProperty(
                                    "/targetRole",
                                    oOpportunity.title
                                );

                                MessageBox.success(
                                    oOpportunity.title +
                                    " has been saved as your target opportunity. Open Learning Pathway to view your development plan."
                                );

                                oController._oActiveDialog.close();

                            } catch (oError) {
                                MessageBox.error(
                                    "Could not save your selected opportunity.\n\n" +
                                    oError.message
                                );

                                oSelectButton.setEnabled(true);
                                oSelectButton.setText(
                                    "Choose This Opportunity"
                                );
                            }
                        }
                    });

                    var oCard = new VBox({
                        width: "100%",
                        items: [
                            new Title({
                                text: (i + 1) + ". " + oOpportunity.title,
                                level: "H3"
                            }),

                            new Text({
                                text: oOpportunity.description,
                                wrapping: true
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            oScore,

                            this._sectionTitle("Your Matching Skills"),
                            oMatchDetails,

                            this._sectionTitle("Skills to Develop"),
                            oGapDetails,

                            this._sectionTitle("Why This Opportunity?"),
                            new Text({
                                text: oOpportunity.explanation,
                                wrapping: true
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            oSelectButton
                        ]
                    }).addStyleClass(
                        "sapUiMediumMarginTop sapUiMediumMarginBottom sapUiContentPadding"
                    );

                    aContent.push(oCard);
                }.bind(this));

                aContent.push(this._sectionTitle(
                    "How Matching Works"
                ));

                aContent.push(new Text({
                    text: "The prototype compares your saved skills with a defined set of capabilities for each opportunity. It also checks relevant words in your current role and work description. The percentage is an illustrative profile-match estimate, not a hiring probability or a verified job-market score.",
                    wrapping: true
                }).addStyleClass("sapUiSmallMarginBottom"));

                aContent.push(new Button({
                    text: "Open My Learning Pathway",
                    type: "Emphasized",
                    width: "100%",
                    press: function () {
                        oController._oActiveDialog.close();
                        oController.onNavLearning();
                    }
                }));

                this._showDialog(
                    "Opportunity Matching | Your Career Options",
                    aContent
                );
            },
            // -------------------------------------------------
            // FAIRNESS REVIEW
            // FAIRNESS REVIEW
// -------------------------------------------------
onNavFairness: function () {
    
    var oController = this;
    var oModel = this.getView().getModel("user");

    var aSkills = oModel.getProperty("/skills") || [];
    var sCurrentRole = oModel.getProperty("/currentRole") || "";
    var sWork = oModel.getProperty("/workExperience") || "";
    var sTargetRole = oModel.getProperty("/targetRole") || "";
    var nExperience = Number(oModel.getProperty("/experience")) || 0;

    var aContent = [];
    var aMissingInfo = [];

    // Check profile completeness
    if (!sCurrentRole.trim()) {
        aMissingInfo.push("Current role is missing.");
    }

    if (!aSkills.length) {
        aMissingInfo.push("No skills have been added.");
    }

    if (!sWork.trim()) {
        aMissingInfo.push("Work responsibilities are missing.");
    }

    if (!sTargetRole.trim()) {
        aMissingInfo.push("No target career role has been selected.");
    }

    // Profile audit
    aContent.push(this._sectionText(
        "This report checks your career profile and explains how your opportunity recommendations are generated."
    ));

    aContent.push(this._sectionTitle("Your Profile Audit"));

    aContent.push(new VBox({
        width: "100%",
        items: [
            new Text({
                text: "Current Role: " + (sCurrentRole || "Not provided"),
                wrapping: true
            }),
            new Text({
                text: "Experience: " + nExperience + " years",
                wrapping: true
            }),
            new Text({
                text: "Skills: " + (aSkills.join(", ") || "Not provided"),
                wrapping: true
            }),
            new Text({
                text: "Target Role: " + (sTargetRole || "Not selected"),
                wrapping: true
            })
        ]
    }).addStyleClass("sapUiSmallMarginBottom"));

    // Profile completeness
    aContent.push(this._sectionTitle("Profile Completeness"));

    if (aMissingInfo.length > 0) {
        aContent.push(new MessageStrip({
            text: "Some profile information is incomplete. This may affect recommendation accuracy.",
            type: "Warning",
            showIcon: true
        }));

        aMissingInfo.forEach(function (sItem) {
            aContent.push(new Text({
                text: "• " + sItem,
                wrapping: true
            }));
        });

        aContent.push(new Button({
            text: "Update My Profile",
            type: "Emphasized",
            width: "100%",
            press: function () {
                oDialog.close();
                oController.onNavProfile();
            }
        }).addStyleClass("sapUiSmallMarginTop"));

    } else {
        aContent.push(new MessageStrip({
            text: "The main profile fields required for this prototype are available.",
            type: "Success",
            showIcon: true
        }));
    }

    // Recommendation transparency
    aContent.push(this._sectionTitle("Recommendation Transparency"));

    aContent.push(new Text({
        text: "Your recommendations use your skills, current role and work responsibilities.",
        wrapping: true
    }));

    aContent.push(new MessageStrip({
        text: "Age and gender are not used in the current Opportunity Matching calculation.",
        type: "Success",
        showIcon: true
    }).addStyleClass("sapUiSmallMarginTop"));

    // Career recommendation
    aContent.push(this._sectionTitle("Your Career Recommendation"));

    aContent.push(new Text({
        text: sTargetRole
            ? "Your selected target role is " + sTargetRole +
              ". Review its matching skills and development requirements in Opportunity Matching."
            : "You have not selected a target role yet. Explore Opportunity Matching to see career options based on your skills.",
        wrapping: true
    }));

    aContent.push(new Button({
        text: "Review Opportunity Matching",
        width: "100%",
        press: function () {
            oDialog.close();
            oController.onNavMatching();
        }
    }).addStyleClass("sapUiSmallMarginTop"));

    // Fairness concern
    aContent.push(this._sectionTitle("Report a Fairness Concern"));

    var oConcernInput = new sap.m.TextArea({
        width: "100%",
        rows: 3,
        placeholder: "Describe why you think a recommendation is unfair..."
    });

    aContent.push(oConcernInput);

    aContent.push(new Button({
        text: "Submit Concern",
        type: "Emphasized",
        width: "100%",
        press: function () {
            var sConcern = oConcernInput.getValue().trim();

            if (!sConcern) {
                MessageToast.show("Please describe your fairness concern first.");
                return;
            }

            MessageBox.information(
                "Your concern has been recorded in this session. Permanent storage requires backend support and an authorised reviewer."
            );

            oConcernInput.setValue("");
        }
    }).addStyleClass("sapUiSmallMarginTop"));

    // Audit limitations
    aContent.push(this._sectionTitle("Audit Limitations"));

    aContent.push(new Text({
        text: "This prototype checks your profile and recommendation inputs. It does not compare outcomes across multiple workers or independently verify fairness across demographic groups. Submitted concerns are not permanently stored.",
        wrapping: true
    }));

    this._showDialog(
    "Fairness Review | Personal Audit",
    aContent
);
},

           

            // -------------------------------------------------
            // SETTINGS
            // -------------------------------------------------

            onNavSettings: function () {
                this._showSection(
                    "Settings",
                    "Manage your prototype profile and understand how Career Orchestrator handles your information.",
                    [
                        "Profile information is stored in the SAP CAP backend",
                        "No real password or account authentication is connected",
                        "Career recommendations are prototype estimates",
                        "Learning progress is saved through the backend",
                        "Use Help and Support for prototype guidance"
                    ]
                );
            },

            // -------------------------------------------------
            // HELP AND SUPPORT
            // -------------------------------------------------

            onNavHelp: function () {
                this._showSection(
                    "Help and Support",
                    "Career Orchestrator helps workers translate their existing experience into new career possibilities and practical learning plans.",
                    [
                        "Step 1: Complete My Profile with your current role and skills",
                        "Step 2: Describe your responsibilities in Skills Discovery",
                        "Step 3: Review the transferable skills identified",
                        "Step 4: Explore adjacent roles in Market Intelligence",
                        "Step 5: Select a target role",
                        "Step 6: Follow the personalised Learning Pathway",
                        "Step 7: Mark learning activities as completed and choose whether to add those skills to your profile"
                    ]
                );
            },

            // -------------------------------------------------
            // DASHBOARD ACTIONS
            // -------------------------------------------------

            onExploreOpportunities: function () {
                this.onNavMarket();
            },

            onViewRecommendations: function () {
                this.onNavMarket();
            },

            onSearch: function (oEvent) {
                var sQuery = (oEvent.getParameter("query") || "").trim();

                if (!sQuery) {
                    MessageToast.show("Enter a role, skill or company to search.");
                    return;
                }

                MessageToast.show(
                    "Search received: " + sQuery +
                    ". Connect a job and skills data source to return live results."
                );
            }
        }
    );
});
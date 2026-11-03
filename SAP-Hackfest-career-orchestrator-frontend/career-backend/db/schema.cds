
using { cuid, managed } from '@sap/cds/common';

namespace career;

entity Profiles : cuid, managed {
    name                  : String(100) not null;
    email                 : String(255);
    currentRole           : String(120);
    yearsExperience       : Integer;
    skills                : LargeString;
    workExperience        : LargeString;
    targetRole            : String(120);
    learningProgress      : Integer default 0;
    completedActivities   : LargeString;
}

"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.get("/analytics/student/{email}")
def get_student_analytics(email: str):
    """Get analytics for a specific student"""
    enrolled_activities = []
    total_hours = 0
    
    # Helper function to estimate hours from schedule string
    def estimate_hours(schedule: str) -> float:
        """Estimate weekly hours from schedule string"""
        # Count days mentioned
        days = 0
        if "Monday" in schedule or "Mondays" in schedule:
            days += 1
        if "Tuesday" in schedule or "Tuesdays" in schedule:
            days += 1
        if "Wednesday" in schedule or "Wednesdays" in schedule:
            days += 1
        if "Thursday" in schedule or "Thursdays" in schedule:
            days += 1
        if "Friday" in schedule or "Fridays" in schedule:
            days += 1
        
        # Estimate 1.5 hours per session as default
        return days * 1.5
    
    for activity_name, activity_data in activities.items():
        if email in activity_data["participants"]:
            enrolled_activities.append({
                "name": activity_name,
                "schedule": activity_data["schedule"]
            })
            total_hours += estimate_hours(activity_data["schedule"])
    
    # Note: attendance_rate and completion_rate are placeholder values
    # In a real system, these would be calculated from actual attendance/completion data
    return {
        "email": email,
        "total_enrolled": len(enrolled_activities),
        "activities": enrolled_activities,
        "hours_per_week": total_hours,
        "attendance_rate": 95,  # Placeholder - would be calculated from actual data
        "completion_rate": 90   # Placeholder - would be calculated from actual data
    }


@app.get("/analytics/activity/{activity_name}")
def get_activity_analytics(activity_name: str):
    """Get analytics for a specific activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity = activities[activity_name]
    enrollment_count = len(activity["participants"])
    capacity = activity["max_participants"]
    utilization = (enrollment_count / capacity * 100) if capacity > 0 else 0
    
    return {
        "name": activity_name,
        "description": activity["description"],
        "schedule": activity["schedule"],
        "enrollment_count": enrollment_count,
        "max_participants": capacity,
        "capacity_utilization": round(utilization, 1),
        "spots_available": capacity - enrollment_count,
        "participants": activity["participants"]
    }


@app.get("/analytics/overview")
def get_overview_analytics():
    """Get system-wide analytics"""
    total_students = set()
    activity_stats = []
    
    for activity_name, activity_data in activities.items():
        enrollment = len(activity_data["participants"])
        capacity = activity_data["max_participants"]
        utilization = (enrollment / capacity * 100) if capacity > 0 else 0
        
        activity_stats.append({
            "name": activity_name,
            "enrollment": enrollment,
            "capacity": capacity,
            "utilization": round(utilization, 1)
        })
        
        total_students.update(activity_data["participants"])
    
    # Sort by enrollment for popularity
    activity_stats_sorted = sorted(activity_stats, key=lambda x: x["enrollment"], reverse=True)
    
    return {
        "total_students": len(total_students),
        "total_activities": len(activities),
        "average_enrollment": round(sum(a["enrollment"] for a in activity_stats) / len(activities), 1) if activities else 0,
        "total_capacity": sum(a["capacity"] for a in activity_stats),
        "overall_utilization": round(sum(a["enrollment"] for a in activity_stats) / sum(a["capacity"] for a in activity_stats) * 100, 1) if activity_stats else 0,
        "activity_stats": activity_stats_sorted
    }

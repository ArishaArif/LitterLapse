# seed_admin.py
import getpass
from app.database import SessionLocal
from app import models, auth

db = SessionLocal()
email = input("Email: ")
password = getpass.getpass("Password: ")
role = input("Role (Admin/Reviewer): ").strip() or "Admin"

existing = db.query(models.User).filter(models.User.email == email).first()
if existing:
    print("User already exists.")
else:
    user = models.User(email=email, hashed_password=auth.hash_password(password), role=role)
    db.add(user)
    db.commit()
    print(f"Created {role} user: {email}")
db.close()
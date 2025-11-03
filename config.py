import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'chave-secreta-flask'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///../instance/financeflow.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

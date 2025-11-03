from flask import render_template, redirect, url_for, flash, request
from flask_login import login_user, login_required, logout_user, current_user
from app import db
from app.models import User
from flask import current_app as app

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Email ou senha inválidos.', 'danger')

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        if User.query.filter_by(email=email).first():
            flash('Usuário já cadastrado.', 'warning')
        else:
            new_user = User(email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            flash('Usuário registrado com sucesso!', 'success')
            return redirect(url_for('login'))

    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

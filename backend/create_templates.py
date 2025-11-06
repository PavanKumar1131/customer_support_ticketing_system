import os
import sys

def create_templates():
    """Create all required template files"""
    
    # Get the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(backend_dir, 'templates')
    
    print(f"Creating templates in: {templates_dir}")
    
    # Create templates directory
    if not os.path.exists(templates_dir):
        os.makedirs(templates_dir)
        print("✅ Created templates directory")
    
    # Create basic home.html
    home_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Support System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 2.5rem;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
            line-height: 1.6;
            font-size: 1.1rem;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            margin: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            transition: transform 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 2rem 0;
        }
        .feature {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
        }
        .test-creds {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Customer Support Ticketing System</h1>
        <p>Your application is running successfully! This is a basic home page.</p>
        
        <div class="features">
            <div class="feature">
                <h3>👥 Auth</h3>
                <p>User authentication</p>
            </div>
            <div class="feature">
                <h3>🎫 Tickets</h3>
                <p>Ticket management</p>
            </div>
            <div class="feature">
                <h3>📊 Dashboard</h3>
                <p>Admin interface</p>
            </div>
        </div>
        
        <div class="test-creds">
            <h4>Test Credentials:</h4>
            <p><strong>Admin:</strong> admin@flipkart.com / admin123</p>
            <p><strong>User:</strong> user@example.com / user123</p>
        </div>
        
        <div>
            <a href="/auth/login" class="btn">Login</a>
            <a href="/auth/signup" class="btn">Sign Up</a>
        </div>
    </div>
</body>
</html>"""
    
    # Create login.html
    login_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Customer Support</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .auth-container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
        }
        h2 {
            text-align: center;
            margin-bottom: 1rem;
            color: #333;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
        }
        button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
        }
        button:hover {
            opacity: 0.9;
        }
        .test-creds {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 1rem 0;
            font-size: 0.9rem;
        }
        .back-link {
            text-align: center;
            margin-top: 1rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <h2>Login</h2>
        
        <div class="test-creds">
            <strong>Test Credentials:</strong><br>
            Admin: admin@flipkart.com / admin123<br>
            User: user@example.com / user123
        </div>
        
        <form method="POST">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" value="admin@flipkart.com" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" value="admin123" required>
            </div>
            
            <button type="submit">Login</button>
        </form>
        
        <div class="back-link">
            <a href="/">← Back to Home</a>
        </div>
    </div>
</body>
</html>"""
    
    # Create signup.html
    signup_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Customer Support</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .auth-container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
        }
        h2 {
            text-align: center;
            margin-bottom: 1rem;
            color: #333;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
        }
        button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
        }
        button:hover {
            opacity: 0.9;
        }
        .back-link {
            text-align: center;
            margin-top: 1rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <h2>Sign Up</h2>
        
        <form method="POST">
            <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required minlength="6">
            </div>
            
            <button type="submit">Create Account</button>
        </form>
        
        <div class="back-link">
            <a href="/auth/login">Already have an account? Sign in</a><br>
            <a href="/">← Back to Home</a>
        </div>
    </div>
</body>
</html>"""
    
    # Create basic dashboard templates
    user_dashboard_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 1rem 2rem;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .main {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .btn {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
        }
        .nav-links {
            display: flex;
            gap: 1rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>User Dashboard</h1>
        <div class="nav-links">
            <a href="/" class="btn">Home</a>
            <a href="/auth/logout" class="btn">Logout</a>
        </div>
    </div>
    
    <div class="main">
        <div class="stats">
            <div class="stat-card">
                <h3>Open Tickets</h3>
                <p id="open-tickets">0</p>
            </div>
            <div class="stat-card">
                <h3>Total Tickets</h3>
                <p id="total-tickets">0</p>
            </div>
        </div>
        
        <h2>Welcome to your Dashboard!</h2>
        <p>The dashboard functionality will be loaded dynamically.</p>
    </div>
</body>
</html>"""
    
    # Create error pages
    error_404_content = """<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            font-size: 3rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <h1>404</h1>
    <p>Page not found</p>
    <a href="/">Go Home</a>
</body>
</html>"""
    
    error_500_content = """<!DOCTYPE html>
<html>
<head>
    <title>Server Error</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            font-size: 3rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <h1>500</h1>
    <p>Internal server error</p>
    <a href="/">Go Home</a>
</body>
</html>"""
    
    # Write template files
    templates = {
        'home.html': home_content,
        'login.html': login_content,
        'signup.html': signup_content,
        'user_dashboard.html': user_dashboard_content,
        '404.html': error_404_content,
        '500.html': error_500_content
    }
    
    for filename, content in templates.items():
        filepath = os.path.join(templates_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Created {filename}")
    
    print("\n🎉 All templates created successfully!")
    print("You can now run: python app.py")

if __name__ == '__main__':
    create_templates()
-- Create the database and user with proper permissions
CREATE DATABASE IF NOT EXISTS content_platform;

-- Create user that can connect from any host
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'Hacker!@#123123';

-- Grant all privileges on the content_platform database
GRANT ALL PRIVILEGES ON content_platform.* TO 'app_user'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

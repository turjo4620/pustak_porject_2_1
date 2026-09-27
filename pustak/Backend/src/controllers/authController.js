const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

const createToken = (user) => {
    const secret = process.env.JWT_SECRET || 'dev-auth-secret';
    return jwt.sign(
        { sub: user.id, name: user.name, email: user.email, role: user.role },
        secret,
        { expiresIn: '7d' }
    );
};

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await authService.signupUser(name, email, password);
        const token = createToken(user);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully. Welcome to Puştak!',
            token,
            user
        });
    } catch (error) {
        console.error('Signup error:', error.message);
        const status = error.status || 500;
        return res.status(status).json({
            success: false,
            message: error.message || 'Unable to create your account right now.'
        });
    }
};

const login = async (req, res) => {
    try {
        const user = await authService.loginUser(req.body.email, req.body.password, 'customer');
        const token = createToken(user);

        return res.status(200).json({
            success: true,
            message: 'Signed in successfully.',
            token,
            user
        });
    } catch (error) {
        console.error('Login error:', error.message);
        const status = error.status || 500;
        return res.status(status).json({
            success: false,
            message: error.message || 'Unable to sign you in right now.'
        });
    }
};

const adminLogin = async (req, res) => {
    try {
        const user = await authService.loginUser(req.body.email, req.body.password, 'admin');
        const token = createToken(user);

        return res.status(200).json({
            success: true,
            message: 'Admin signed in successfully.',
            token,
            user
        });
    } catch (error) {
        console.error('Admin login error:', error.message);
        const status = error.status || 500;
        return res.status(status).json({
            success: false,
            message: error.message || 'Unable to sign you in right now.'
        });
    }
};

const getMe = async (req, res) => {
    try {
        const pool = require('../config/db');
        const result = await pool.query(
            'SELECT user_id, name, email, phone_number, role FROM users WHERE user_id = $1',
            [req.userId]
        );
        if (!result.rows.length) {
            return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'প্রোফাইল লোড করা যায়নি' });
    }
};

// PATCH /api/auth/me — update name and/or phone
const updateMe = async (req, res) => {
    try {
        const pool = require('../config/db');
        const { name, phone_number } = req.body;

        const fields = [];
        const values = [];
        let idx = 1;

        if (name !== undefined) {
            const clean = String(name).trim();
            if (!clean) return res.status(400).json({ message: 'নাম খালি রাখা যাবে না' });
            fields.push(`name = $${idx++}`); values.push(clean);
        }
        if (phone_number !== undefined) {
            fields.push(`phone_number = $${idx++}`); values.push(String(phone_number).trim() || null);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'পরিবর্তন করার কিছু নেই' });
        }

        values.push(req.userId);
        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING user_id, name, email, phone_number`,
            values
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('updateMe error:', err);
        res.status(500).json({ message: 'প্রোফাইল আপডেট করা যায়নি' });
    }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const pool   = require('../config/db');
        const bcrypt = require('bcryptjs');
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'সব ঘর পূরণ করুন' });
        }
        if (new_password.length < 8) {
            return res.status(400).json({ message: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে' });
        }

        const row = await pool.query(
            'SELECT password_hash FROM users WHERE user_id = $1', [req.userId]
        );
        if (!row.rows.length) return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });

        const valid = await bcrypt.compare(current_password, row.rows[0].password_hash);
        if (!valid) return res.status(400).json({ message: 'বর্তমান পাসওয়ার্ড ভুল' });

        const hash = await bcrypt.hash(new_password, 12);
        await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hash, req.userId]);

        res.json({ message: 'পাসওয়ার্ড পরিবর্তন সফল হয়েছে' });
    } catch (err) {
        console.error('changePassword error:', err);
        res.status(500).json({ message: 'পাসওয়ার্ড পরিবর্তন করা যায়নি' });
    }
};

// DELETE /api/auth/me — deactivate account
const deleteMe = async (req, res) => {
    try {
        const pool   = require('../config/db');
        const bcrypt = require('bcryptjs');
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'নিশ্চিত করতে পাসওয়ার্ড দিন' });
        }

        const row = await pool.query(
            'SELECT password_hash FROM users WHERE user_id = $1', [req.userId]
        );
        if (!row.rows.length) return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });

        const valid = await bcrypt.compare(password, row.rows[0].password_hash);
        if (!valid) return res.status(400).json({ message: 'পাসওয়ার্ড ভুল হয়েছে' });

        // Soft-delete: set status to Inactive
        await pool.query(
            "UPDATE users SET status = 'Inactive' WHERE user_id = $1", [req.userId]
        );

        res.json({ message: 'অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে' });
    } catch (err) {
        console.error('deleteMe error:', err);
        res.status(500).json({ message: 'অ্যাকাউন্ট মুছে ফেলা যায়নি' });
    }
};

module.exports = {
    signup,
    login,
    adminLogin,
    getMe,
    updateMe,
    changePassword,
    deleteMe,
};
const adminLogin = require("../schema/adminLoginSchema/adminLoginSchema");
const OTP = require("../schema/adminLoginSchema/adminOtpSchema");
const { sendOTP } = require("../utils/sendOtp");

const authController = {};


authController.loginPage = async (req, res) => {
    try {
        res.render("admin-panel/authPage/loginPage")
    } catch (error) {
        console.log("error", error)
    }
}

authController.successGoogleLogin = async (req, res) => {

    try {

        if (!req.user) {
            console.log('No user found in session');
            return res.redirect('/failure');
        }

        const existingAdmin = await adminLogin.findOne();
        console.log(existingAdmin, 'existingAdminexistingAdmin');

        if (existingAdmin) {

            if (existingAdmin.email === req.user.email) {

                req.session.adminId = existingAdmin._id;
                return res.redirect('/admin');

            } else {

                return res.redirect('/');
            }

        }

        const admin = await adminLogin.create({
            email: req.user.email,
            name: req.user.displayName
        })

        req.session.adminId = admin._id;

        res.redirect('/admin')

    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/failure');
    }

}

authController.failureGoogleLogin = (req, res) => {
    console.log('Authentication failed');
    res.redirect('/')
}

authController.getAdminEmail = async (req, res) => {
    try {
        const adminEmail = await adminLogin.findOne();

        res.json({
            status: true,
            admin: adminEmail
        })

    } catch (err) {
        console.error('Get admin error :', err);
    }
}

authController.getAdminEmailOtp = async (req, res) => {

    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        await sendOTP(email);
        res.status(200).json({ message: 'OTP sent to your email' });

    } catch (err) {
        console.error('Get admin error :', err);
    }
}

authController.verifyOTP = async (req, res) => {

    const email = req.query.email;
    const enteredOTP = req.query.otp;

    console.log(enteredOTP, 'enteredOTPenteredOTPenteredOTPenteredOTPenteredOTP');

    if (!email || !enteredOTP) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {

        const otpRecord = await OTP.findOne({ email });

        console.log(otpRecord, 'orporptotper');

        if (otpRecord.otp === enteredOTP) {
            res.json({ status: true, message: 'OTP verified successfully' });
        } else {
            res.json({ status: false, message: 'Invalid OTP' });
        }

    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(500).json({ error: 'Server error while verifying OTP' });
    }
}

authController.logout = async (req, res) => {
    try {

        req.session.adminId = null;

        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
        });

        req.logout(function (err) {
            if (err) {
                console.error('Passport logout error:', err);
                return res.redirect('/failure');
            }

            res.clearCookie('connect.sid');

            res.redirect('/');
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/failure');
    }
}

module.exports = authController;
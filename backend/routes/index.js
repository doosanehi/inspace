var express = require("express");
var router = express.Router();
const hashPassword = require("../utils/hash-password");
const asyncHandler = require("../utils/async-handler");
const { User, Ticket, Seat } = require("../models/index");
const nodemailer = require('nodemailer')
const generateRandomPassword = require('../utils/generate-random-password')
const sendMail = require('../utils/send-mail')

router.post(
    "/signup",
    asyncHandler(async(req, res, next) => {
        const { name, userId, password, checkPassword } = req.body;
        const hashedPassword = hashPassword(password);
        const existId = await User.findOne({ userId });
        if (existId) {
            throw new Error("사용중인 아이디입니다.");
            return;
        }
        if (password != checkPassword) {
            throw new Error("비밀번호가 일치하지 않습니다.");
            return;
        }

        await User.create({
            name,
            userId,
            password: hashedPassword,
        });
        res.status(201).json({ message: "success" });
    })
);

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function(res, req) {
    res.statusCode(200).json({ message: 'success' })
})

router.get("/logout", (req, res, next) => {
    req.logout();
    res.status(204).json({ message: "success" });
});

// router.post(
//     '/findpw',
//     asyncHandler(async(req, res, next) => {
//         const { name } = req.body;
//         const Pname = await User.findOne({ name });
//         if (!Pname) {
//             throw new Error('유효한 사용자가 아닙니다.')
//         }


//     })
// )

router.post('/reset-password', asyncHandler(async(req, res) => {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) {
        throw new Error('해당 메일로 가입된 아이디가 없습니다.')
    }

    const password = generateRandomPassword();
    await User.updateOne({ userId }, {
        password: hashPassword(password),
        passwordReset: true,
    })

    await sendMail(email, '비밀번호가 변경되었습니다.', `변경된 비밀번호는 : ${password} 입니다.`);
}))

router.post('/change-password', asyncHandler(async(req, res) => {
    const { currentPassword, password } = req.body;
    const user = await User.findOne({ _id: req.user.id });

    if (user.password !== hashPassword(currentPassword)) {
        throw new Error('임시 비밀번호가 일치하지 않습니다.');
    }

    await User.updateOne({ _id: user.id }, {
        password: hashPassword(password),
        passwordReset: false,


    });

    res.status(200).json({ message: "success" });
}))


router.post('/info-change', asyncHandler(async(req, res, next) => {
    const { password, newpassword, confirmpassword } = req.body;
    const user = await User.findOne({ _id: req.user.id });

    if (user.password != hashPassword(password)) {
        throw new Error('기존 비밀번호를 다시 입력해주세요')
    } else if (hashPassword(password) == hashPassword(newpassword)) {
        throw new Error('기존비밀번호와 새 비밀번호를 다르게 입력해주세요')
    }
    if (newpassword != confirmpassword) {
        throw new Error('새비밀번호를 다시 확인해주세요.')
    }
    await User.updateOne({ _id: user.id }, {
        password: hashPassword(password)
    })
}))

module.exports = router;
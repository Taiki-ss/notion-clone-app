const CryptoJs = require('crypto-js');
const JWT = require('jsonwebtoken');

const User = require('../models/user');

// ユーザー新規登録用API
exports.register = async (req, res) => {
  const password = req.body.password;

  try {
    // パスワードの暗号化
    req.body.password = CryptoJs.AES.encrypt(password, process.env.SECRET_KEY);
    // ユーザー新規作成
    const user = await User.create(req.body);
    // JWTの発行
    const token = JWT.sign({ id: user._id }, process.env.TOKEN_SECRET_KEY, {
      expiresIn: '24h',
    });
    return res.status(200).json({ user, token });
  } catch (error) {
    return res.status(500).json(error);
  }
};

// ユーザーログイン用API
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username }).select(
      'password username'
    );
    // DBからユーザーが存在するか探す
    if (!user) {
      return res.status(401).json({
        errors: {
          param: 'username',
          message: 'ユーザー名が無効です',
        },
      });
    }

    const decryptedPassword = CryptoJs.AES.decrypt(
      user.password,
      process.env.SECRET_KEY
    ).toString(CryptoJs.enc.Utf8);

    if (password !== decryptedPassword) {
      return res.status(401).json({
        errors: {
          param: 'password',
          message: 'パスワードが無効です',
        },
      });
    }

    // JWTの発行
    const token = JWT.sign({ id: user._id }, process.env.TOKEN_SECRET_KEY, {
      expiresIn: '24h',
    });

    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};
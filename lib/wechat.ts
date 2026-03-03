/**
 * @file lib/wechat.ts
 * @description 微信登录服务
 */

import crypto from 'crypto';

const WECHAT_APPID = process.env.WECHAT_MINIAPP_APPID;
const WECHAT_SECRET = process.env.WECHAT_MINIAPP_SECRET;

export interface WechatUserInfo {
  openId: string;
  nickName: string;
  gender: number;
  language: string;
  city: string;
  province: string;
  country: string;
  avatarUrl: string;
  watermark: {
    timestamp: number;
    appid: string;
  };
}

export interface FullUserInfo {
  rawData: string;
  signature: string;
  encryptedData: string;
  iv: string;
}

/**
 * 通过 code 获取微信 openid 和 session_key
 */
export async function getWechatSession(
  code: string
): Promise<{ openid: string; session_key: string }> {
  if (!WECHAT_APPID || !WECHAT_SECRET) {
    throw new Error('微信配置未设置：请配置 WECHAT_MINIAPP_APPID 和 WECHAT_MINIAPP_SECRET');
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode) {
    throw new Error(`微信API错误: ${data.errcode} - ${data.errmsg || '未知错误'}`);
  }

  if (!data.openid) {
    throw new Error('获取微信openid失败');
  }

  return {
    openid: data.openid,
    session_key: data.session_key || '',
  };
}

/**
 * 验证用户信息完整性
 */
export function verifyUserInfoSignature(
  rawData: string,
  signature: string,
  sessionKey: string
): boolean {
  const sha1 = crypto.createHash('sha1').update(rawData + sessionKey).digest('hex');
  return sha1 === signature;
}

/**
 * 解密微信用户数据
 * 注意：解密后的数据不包含 openId，openId 需要从 jscode2session 接口获取
 */
export function decryptUserInfoData(
  sessionKey: string,
  encryptedData: string,
  iv: string
): Omit<WechatUserInfo, 'openId'> {
  try {
    const _sessionKey = Buffer.from(sessionKey, 'base64');
    const _encryptedData = Buffer.from(encryptedData, 'base64');
    const _iv = Buffer.from(iv, 'base64');

    // 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', _sessionKey, _iv);
    decipher.setAutoPadding(true);
    // 使用 Buffer 直接解密，然后转换为字符串
    const decrypted = Buffer.concat([
      decipher.update(_encryptedData),
      decipher.final(),
    ])
    const decoded = decrypted.toString('utf8')

    const userInfo = JSON.parse(decoded) as any;

    // 验证 watermark appid
    if (userInfo.watermark?.appid !== WECHAT_APPID) {
      throw new Error('watermark appid 错误');
    }

    // 注意：解密后的用户信息中不包含 openId，openId 需要从 jscode2session 接口获取
    // 返回解密后的用户信息（不包含 openId）
    return {
      nickName: userInfo.nickName || userInfo.nickname || '',
      gender: userInfo.gender || 0,
      language: userInfo.language || 'zh_CN',
      city: userInfo.city || '',
      province: userInfo.province || '',
      country: userInfo.country || '',
      avatarUrl: userInfo.avatarUrl || userInfo.avatar || '',
      watermark: userInfo.watermark,
    } as Omit<WechatUserInfo, 'openId'>
  } catch (err) {
    throw new Error('解析用户数据错误：' + (err instanceof Error ? err.message : String(err)));
  }
}

/**
 * 微信登录（完整流程）
 */
export async function wechatLogin(
  code: string,
  fullUserInfo: FullUserInfo
): Promise<{ errno: number; errmsg: string; data: WechatUserInfo | null }> {
  try {
    // 1. 获取 session（包含 openid）
    const sessionData = await getWechatSession(code);

    // 2. 验证用户信息完整性
    if (!verifyUserInfoSignature(fullUserInfo.rawData, fullUserInfo.signature, sessionData.session_key)) {
      return { errno: 400, errmsg: 'signature 校验不一致', data: null };
    }

    // 3. 解析用户数据
    const decryptedUserInfo = decryptUserInfoData(
      sessionData.session_key,
      fullUserInfo.encryptedData,
      fullUserInfo.iv
    );

    // 4. 将 openid 添加到用户信息中（openid 来自 jscode2session，不在加密数据中）
    const wechatUserInfo: WechatUserInfo = {
      openId: sessionData.openid, // openid 从 session 中获取
      nickName: decryptedUserInfo.nickName || '',
      gender: decryptedUserInfo.gender || 0,
      language: decryptedUserInfo.language || 'zh_CN',
      city: decryptedUserInfo.city || '',
      province: decryptedUserInfo.province || '',
      country: decryptedUserInfo.country || '',
      avatarUrl: decryptedUserInfo.avatarUrl || '',
      watermark: decryptedUserInfo.watermark,
    };

    return { errno: 0, errmsg: '', data: wechatUserInfo };
  } catch (e) {
    return {
      errno: 400,
      errmsg: '微信登录失败：' + (e instanceof Error ? e.message : String(e)),
      data: null,
    };
  }
}

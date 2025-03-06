// 获取DOM元素
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const encodeType = document.getElementById('encode-type');
const charCount = document.getElementById('char-count');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const swapBtn = document.getElementById('swap-btn');

// 在文件开头添加
let currentLang = 'zh-CN';

// 更新字符计数
function updateCharCount() {
    charCount.textContent = inputText.value.length;
}

// 添加 Base32 编码/解码函数
const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(input) {
    const bytes = new TextEncoder().encode(input);
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < bytes.length; i++) {
        value = (value << 8) | bytes[i];
        bits += 8;
        while (bits >= 5) {
            output += base32Chars[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += base32Chars[(value << (5 - bits)) & 31];
    }
    // 添加填充
    while (output.length % 8) output += '=';
    return output;
}

function base32Decode(input) {
    input = input.replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    let output = new Uint8Array(input.length * 5 / 8 | 0);
    let index = 0;

    for (let i = 0; i < input.length; i++) {
        value = (value << 5) | base32Chars.indexOf(input[i].toUpperCase());
        bits += 5;
        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return new TextDecoder().decode(output);
}

// 编码转换函数
function convert() {
    const input = inputText.value;
    const type = encodeType.value;
    let result = '';

    try {
        switch(type) {
            case 'base64-encode':
                result = btoa(unescape(encodeURIComponent(input)));
                break;
            case 'base64-decode':
                result = decodeURIComponent(escape(atob(input)));
                break;
            case 'url-encode':
                // 只编码特殊字符，保留 UTF-8 字符
                result = encodeURI(input);
                break;
            case 'url-decode':
                result = decodeURI(input);
                break;
            case 'url-utf8-encode':
                // 完全编码，包括所有非 ASCII 字符
                result = encodeURIComponent(input);
                break;
            case 'url-utf8-decode':
                result = decodeURIComponent(input);
                break;
            case 'unicode-encode':
                result = input.split('').map(char => {
                    return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
                }).join('');
                break;
            case 'unicode-decode':
                result = input.replace(/\\u[\dA-F]{4}/gi, match => {
                    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
                });
                break;
            case 'html-encode':
                result = input.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
                    return '&#' + i.charCodeAt(0) + ';';
                });
                break;
            case 'html-decode':
                const textarea = document.createElement('textarea');
                textarea.innerHTML = input;
                result = textarea.value;
                break;
            case 'gbk-encode':
                // 将字符串转换为GBK编码的十六进制字符串
                const gbkBytes = GBK.encode(input);
                result = Array.from(gbkBytes).map(byte => 
                    byte.toString(16).padStart(2, '0')
                ).join(' ').toUpperCase();
                break;
            case 'gbk-decode':
                // 将十六进制字符串转换回GBK编码的文字
                const gbkHex = input.replace(/\s+/g, '');
                const gbkArray = new Uint8Array(gbkHex.match(/.{2}/g).map(byte => 
                    parseInt(byte, 16)
                ));
                result = GBK.decode(gbkArray);
                break;
            case 'gb2312-encode':
                // GB2312是GBK的子集，使用同样的编码方式
                const gb2312Bytes = GBK.encode(input);
                result = Array.from(gb2312Bytes).map(byte => 
                    byte.toString(16).padStart(2, '0')
                ).join(' ').toUpperCase();
                break;
            case 'gb2312-decode':
                // GB2312解码
                const gb2312Hex = input.replace(/\s+/g, '');
                const gb2312Array = new Uint8Array(gb2312Hex.match(/.{2}/g).map(byte => 
                    parseInt(byte, 16)
                ));
                result = GBK.decode(gb2312Array);
                break;
            case 'base32-encode':
                result = base32Encode(input);
                break;
            case 'base32-decode':
                result = base32Decode(input);
                break;
            case 'hex-encode':
                result = Array.from(new TextEncoder().encode(input))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join(' ');
                break;
            case 'hex-decode':
                const bytes = input.replace(/\s+/g, '').match(/.{2}/g) || [];
                result = new TextDecoder().decode(
                    new Uint8Array(bytes.map(b => parseInt(b, 16)))
                );
                break;
            case 'ascii-encode':
                result = Array.from(input).map(char => {
                    const code = char.charCodeAt(0);
                    return code < 128 ? code : '?';
                }).join(' ');
                break;
            case 'ascii-decode':
                result = input.split(/\s+/).map(num => 
                    String.fromCharCode(parseInt(num))
                ).join('');
                break;
            case 'escape-encode':
                result = escape(input);
                break;
            case 'escape-decode':
                result = unescape(input);
                break;
            case 'jwt-decode':
                try {
                    const [header, payload] = input.split('.').slice(0, 2)
                        .map(part => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))));
                    result = 'Header:\n' + JSON.stringify(header, null, 2) + 
                            '\n\nPayload:\n' + JSON.stringify(payload, null, 2);
                } catch {
                    result = '无效的 JWT 格式';
                }
                break;
        }
    } catch (error) {
        result = '转换错误：请检查输入格式是否正确';
        console.error('转换错误:', error);
    }

    outputText.value = result;
}

// 添加语言切换功能
function switchLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // 更新页面文本
    document.title = t.title;
    document.querySelector('h1').textContent = t.title;
    document.querySelector('label[for="input-text"]').textContent = t.inputLabel;
    document.querySelector('label[for="output-text"]').textContent = t.outputLabel;
    document.querySelector('#input-text').placeholder = t.inputPlaceholder;
    document.querySelector('.char-count').firstChild.textContent = t.charCount;
    document.querySelector('#copy-btn').textContent = t.copyButton;
    
    // 更新编码类型选项
    const select = document.querySelector('#encode-type');
    Array.from(select.options).forEach(option => {
        const translatedText = t.encodingTypes[option.value];
        if (translatedText) {
            option.textContent = translatedText;
        }
    });
    
    // 更新按钮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // 保存语言选择到本地存储
    localStorage.setItem('preferred-language', lang);
}

// 添加语言切换按钮事件监听
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchLanguage(btn.dataset.lang);
    });
});

// 获取用户的首选语言
function getPreferredLanguage() {
    // 首先检查本地存储中是否有保存的语言设置
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && translations[savedLang]) {
        return savedLang;
    }
    
    // 检查浏览器语言设置
    const browserLangs = navigator.languages || [navigator.language];
    
    // 遍历浏览器的语言列表
    for (let lang of browserLangs) {
        // 简化语言代码（例如 'zh-TW' -> 'zh'）
        const simpleLang = lang.split('-')[0];
        
        // 检查完整的语言代码
        if (translations[lang]) {
            return lang;
        }
        
        // 检查简化的语言代码
        if (simpleLang === 'zh' && translations['zh-CN']) {
            return 'zh-CN';
        }
    }
    
    // 如果没有匹配的语言，返回英语作为默认语言
    return 'en';
}

// 修改页面加载时的语言初始化逻辑
document.addEventListener('DOMContentLoaded', () => {
    const preferredLang = getPreferredLanguage();
    switchLanguage(preferredLang);
});

// 修改复制按钮的文本更新逻辑
copyBtn.addEventListener('click', () => {
    outputText.select();
    document.execCommand('copy');
    const t = translations[currentLang];
    copyBtn.textContent = t.copied;
    setTimeout(() => {
        copyBtn.textContent = t.copyButton;
    }, 2000);
});

// 清空输入
clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    updateCharCount();
});

// 交换输入输出
swapBtn.addEventListener('click', () => {
    const temp = inputText.value;
    inputText.value = outputText.value;
    outputText.value = temp;
    updateCharCount();
});

// 添加事件监听器
inputText.addEventListener('input', () => {
    updateCharCount();
    convert();
});

// 添加编码格式说明
function addEncodingDescription() {
    const type = encodeType.value;
    let description = '';
    
    switch(type) {
        case 'gbk-encode':
        case 'gb2312-encode':
            description = '输出格式：十六进制字节序列（以空格分隔）';
            break;
        case 'gbk-decode':
        case 'gb2312-decode':
            description = '输入格式：十六进制字节序列（可以带空格）';
            break;
        case 'url-encode':
            description = '只编码特殊字符，保留 UTF-8 字符（如中文）';
            break;
        case 'url-utf8-encode':
            description = '完全编码，将所有非 ASCII 字符转换为 UTF-8 编码';
            break;
        case 'base32-encode':
            description = '使用32个字符编码，常用于需要人工输入的场景';
            break;
        case 'hex-encode':
        case 'hex-decode':
            description = '十六进制格式，以空格分隔';
            break;
        case 'ascii-encode':
            description = '将字符转换为ASCII码（0-127），非ASCII字符显示为?';
            break;
        case 'ascii-decode':
            description = '输入ASCII码（用空格分隔），转换为对应字符';
            break;
        case 'jwt-decode':
            description = '解析JWT令牌的header和payload部分';
            break;
    }
    
    // 更新描述文本
    const descElement = document.getElementById('encoding-description');
    if (description) {
        if (!descElement) {
            const desc = document.createElement('div');
            desc.id = 'encoding-description';
            desc.className = 'encoding-description';
            document.querySelector('.controls').appendChild(desc);
        }
        descElement.textContent = description;
    } else if (descElement) {
        descElement.remove();
    }
}

// 添加事件监听
encodeType.addEventListener('change', () => {
    convert();
    addEncodingDescription();
});

// 初始化
updateCharCount(); 
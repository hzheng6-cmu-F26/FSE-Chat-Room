function formatMessage(id, username, text, createdAt) {
    return {
        id: id,
        username: username,
        text: text,
        createdAt: createdAt
    };
}

module.exports = formatMessage;

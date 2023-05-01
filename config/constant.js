const USER_ROLE = {
    ADMIN: 1,
    VENDOR: 2,
    USER: 3,
    DEFAULT_ROLE: 3
};

const ROLE_ACCESS = {
    ADMIN: [
        "manageUser",
        "manageVendor", 
        "manageCategory"
    ],
    VENDOR: [
        "item",
        "manageCoupon"
    ],
    USER: [
        "placeOrder",
        "buyCoupon",
        "myCoupon",
        "manageCart",
        "wallet"
    ]
};

const TRANSACTION_TYPE = {
    item: "item",
    coupon: "coupon",
    comboCoupon: "comboCoupon"
};

const TRANSACTION_STATUS = {
    SUCCESS: "success",
    FAIL: "fail",
    PENDING: "pending"
}

const DISCOUNT_TYPE = {
    PERCENTAGE: "percentage",
    FLATOFF: "flat off"
}

const WALLET_TRANSCATION_TYPE = {
    ADD_TO_WALLET: "ADD_TO_WALLET",
    PAY_FOR_ITEM: "PAY_FOR_ITEM",
    SEND_TO_WALLET: "SEND_TO_WALLET"
}

const SIGNATURE_FOR = {
    ITEM: 1,
    WALLET: 2
}

const PAYMENT_METHOD = {
    WALLET: 1,
    PAYMENT_GATEWAY: 2
}

module.exports = {
    USER_ROLE,
    ROLE_ACCESS,
    TRANSACTION_TYPE,
    TRANSACTION_STATUS,
    DISCOUNT_TYPE,
    WALLET_TRANSCATION_TYPE,
    SIGNATURE_FOR,
    PAYMENT_METHOD
};
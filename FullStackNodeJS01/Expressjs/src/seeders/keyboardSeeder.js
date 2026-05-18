const Category = require('../models/category');
const Keyboard = require('../models/keyboard');

const categories = [
    { name: 'Gaming', slug: 'gaming', description: 'Bàn phím cơ cho game thủ, phản hồi nhanh và độ bền cao.' },
    { name: 'Work & Office', slug: 'work-office', description: 'Bàn phím gọn, êm, tối ưu cho làm việc lâu dài.' },
    { name: 'Custom', slug: 'custom', description: 'Phụ kiện, switch và keycap để build theo phong cách riêng.' },
    { name: 'Wireless', slug: 'wireless', description: 'Bàn phím không dây, linh hoạt cho nhiều thiết bị.' },
    { name: 'Low Profile', slug: 'low-profile', description: 'Thiết kế mỏng, gõ nhanh và tiết kiệm không gian.' },
];

const categoryMapByKeyboardSlug = {
    'keychron-k8-pro': 'wireless',
    'akko-5075b-plus': 'custom',
    'leopold-fc660m': 'low-profile',
    'razer-blackwidow-v4': 'gaming',
    'logitech-mx-keys-mini': 'work-office',
    'nuphy-air75': 'low-profile',
    'monsgeek-m1w': 'custom',
    'corsair-k70-rgb-pro': 'gaming',
};

const imageUrls = [
    'https://th.bing.com/th/id/OIP.LIlql2u8hKJXXUSiZeuuOwHaD_?w=306&h=181&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.U81mdyIXsim7eSmiO6Na7AHaDq?w=326&h=172&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.u27ubnHjMr_CAI3N5eRjEAAAAA?w=303&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.e13DLdAq8X32uOaspFIADAHaHa?w=205&h=205&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.uigcS4TEjbEPFI58nrRE0gHaHa?w=205&h=205&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.WgL-aDtk28RQZlGiKHYONQHaHa?w=205&h=205&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.Y6UEgzvvIWgwNGl6a22LCAHaEK?w=259&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.IkiOjuzfMVum_U2KjpEyJAHaEK?w=282&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.QrlXQ5TuKgT9Ry2IpP0zzgHaHU?w=175&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.qY6FGVFD1SJJIFkFpk754gHaEK?w=304&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.oHoSLPsXpk1YaasTMde_vAHaHa?w=205&h=205&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.0g_jZ4BFUtcQLCc8sEb_7AHaHd?w=177&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.u27ubnHjMr_CAI3N5eRjEAAAAA?w=303&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.4eKMWHmMOY6RbgLLXL6KywHaHa?w=224&h=180&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.zY2gyKPn6NvRIg1-hT8cdAHaEK?w=334&h=187&c=7&r=0&o=7&pid=1.7&rm=3',
];

const baseModels = [
    'Kinetic Nova', 'Aurora Pro', 'Titan V2', 'Mercury TKL', 'Zephyr 75', 'Orbit Mini', 'Atlas Full', 'Nebula 65',
    'Polaris RGB', 'Vortex 60', 'Phoenix Pro', 'Comet Low', 'Argon Wireless', 'Cinder 80', 'Eclipse 68', 'Solaris',
    'Lumen65', 'Obsidian 96', 'Nimbus 75', 'Sable TKL', 'Horizon Mini', 'Galaxy M1', 'Echo Pro', 'Pulse 75',
];

const keyboards = baseModels.map((name, idx) => {
    const brand = ['Keychron','Akko','Leopold','Razer','Logitech','NuPhy','MonsGeek','Corsair'][idx % 8];
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
    const categoryCycle = ['gaming','work-office','custom','wireless','low-profile'];
    const categorySlug = categoryCycle[idx % categoryCycle.length];
    const priceBase = 1200000 + (idx * 100000);
    const images = [
        imageUrls[idx % imageUrls.length],
        imageUrls[(idx + 3) % imageUrls.length],
        imageUrls[(idx + 7) % imageUrls.length],
    ];

    return {
        title: `${name} ${brand}`,
        slug,
        author: brand,
        categorySlug,
        description: `Bàn phím ${name} của ${brand} - thiết kế tối ưu cho ${categorySlug}.`,
        price: priceBase,
        oldPrice: Math.round(priceBase * 1.12),
        discount: Math.floor(Math.random() * 15) + 5,
        stock: 5 + (idx % 10) * 3,
        sold: 10 + idx * 7,
        rating: +(4 + (Math.random() * 1)).toFixed(1),
        reviewCount: 50 + idx * 20,
        images,
        tags: [categorySlug],
        isFeatured: idx % 4 === 0,
        isNewest: idx % 3 === 0,
        isBestSeller: idx % 5 === 0,
        isPromotion: idx % 6 === 0,
        createdAtLabel: '2026-05-17',
    };
});

const slugToCategoryId = async () => {
    const categoryDocs = await Category.find({ slug: { $in: categories.map((item) => item.slug) } });
    const categoryMap = new Map(categoryDocs.map((item) => [item.slug, item._id]));

    return categoryMap;
};

const syncKeyboardCategories = async () => {
    const desiredSlugs = categories.map((item) => item.slug);

    await Promise.all(categories.map((category) => (
        Category.updateOne(
            { slug: category.slug },
            { $set: { name: category.name, description: category.description } },
            { upsert: true },
        )
    )));

    await Category.deleteMany({ slug: { $nin: desiredSlugs } });

    return slugToCategoryId();
};

const seedKeyboardsCollections = async () => {
    const categoryMap = await syncKeyboardCategories();
    const keyboardCount = await Keyboard.countDocuments();

    if (keyboardCount === 0) {
        const keyboardDocs = keyboards.map((keyboard) => ({
            ...keyboard,
            categoryId: categoryMap.get(keyboard.categorySlug),
        }));
        await Keyboard.insertMany(keyboardDocs);
        return;
    }

    const existingKeyboards = await Keyboard.find({});
    const updates = existingKeyboards
        .map((keyboard) => {
            const categorySlug = categoryMapByKeyboardSlug[keyboard.slug];
            const categoryId = categorySlug ? categoryMap.get(categorySlug) : null;

            if (!categoryId) {
                return null;
            }

            return {
                updateOne: {
                    filter: { _id: keyboard._id },
                    update: { $set: { categoryId } },
                },
            };
        })
        .filter(Boolean);

    if (updates.length) {
        await Keyboard.bulkWrite(updates);
    }
};

module.exports = {
    seedKeyboardsCollections,
};
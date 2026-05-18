const Article = require('../models/article');

const articles = [
    {
        title: 'Keyboard Store ra mắt chuyên mục tin tức mới',
        slug: 'keyboard-store-ra-mat-chuyen-muc-tin-tuc-moi',
        summary: 'Khách hàng có thể theo dõi khuyến mãi, bài viết chọn bàn phím và thông tin mới nhất ngay trên website.',
        content: 'Keyboard Store vừa bổ sung chuyên mục tin tức để bạn theo dõi nhanh các bài viết mới, chương trình khuyến mãi và gợi ý chọn bàn phím theo nhu cầu.\n\nMục tiêu của chuyên mục này là giúp người đọc dễ tìm nội dung phù hợp hơn trong từng giai đoạn làm việc, chơi game và build setup.\n\nTrong thời gian tới, Keyboard Store sẽ cập nhật thêm nhiều bài viết hướng dẫn chọn bàn phím, review switch, keycap và tin ưu đãi dành cho thành viên.',
        coverImage: 'https://images.unsplash.com/photo-1511467687858-23d96c32e2ae?auto=format&fit=crop&w=1200&q=80',
        images: [
            'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80',
        ],
        tags: ['tin-tuc', 'keyboard-store', 'announcement'],
        category: 'Tin tức',
        author: 'Admin Keyboard Store',
        isFeatured: true,
        isPublished: true,
    },
    {
        title: 'Top 5 bàn phím nên thử trong năm 2026',
        slug: 'top-5-ban-phim-nen-thu-trong-nam-2026',
        summary: 'Danh sách những mẫu bàn phím phù hợp để gõ êm, chơi game tốt và nâng cấp setup.',
        content: 'Năm 2026 mang đến nhiều lựa chọn bàn phím cơ và bàn phím low-profile đáng chú ý. Danh sách này ưu tiên những mẫu cân bằng giữa trải nghiệm gõ, độ ổn định và tính thẩm mỹ.\n\nBạn có thể tham khảo các chủ đề như layout 75%, TKL, hotswap và bàn phím không dây để chọn đúng nhu cầu sử dụng.\n\nMột chiếc bàn phím phù hợp sẽ giúp công việc hằng ngày dễ chịu hơn và setup của bạn đồng bộ hơn.',
        coverImage: 'https://minhancomputercdn.com/media/product/250_15274_ban_phim_co_khong_day_e_dra_ek368l_alpha_2.jpg',
        images: [
            'https://phucanhcdn.com/media/product/250_62801_b__n_ph__m_c___akko_5108b_the_legend_of_hei_1.jpg',
            'https://phucanhcdn.com/media/product/250_62802_b__n_ph__m_c___akko_5108b_the_legend_of_hei_1.jpg',
            'https://zpro.vn/images/product/500x500/ban-phim-co-akko-5075-v3-white-pink-gradient-frost-pink.1768810403.jpg',
        ],
        tags: ['review', 'keyboard', 'summer'],
        category: 'Gợi ý bàn phím',
        author: 'Admin Keyboard Store',
        isFeatured: true,
        isPublished: true,
    },
    {
        title: 'Ưu đãi tháng này: giảm giá đến 50% cho thành viên',
        slug: 'uu-dai-thang-nay-giam-gia-den-50-cho-ban-phim',
        summary: 'Chương trình khuyến mãi dành cho thành viên đăng nhập, áp dụng trên nhiều mẫu bàn phím nổi bật.',
        content: 'Thành viên đăng nhập sẽ thấy các khung ưu đãi nổi bật ngay trên trang chủ. Các mẫu bàn phím trong danh mục khuyến mãi được chọn lọc theo nhu cầu mua sắm và giá trị sử dụng.\n\nNgoài giảm giá trực tiếp, website còn gợi ý bàn phím mới nhất và bán chạy nhất để người dùng tham khảo nhanh.\n\nĐây là một trong những nội dung cập nhật thường xuyên nhằm tăng tính thực tế cho website bán bàn phím.',
        coverImage: 'https://phucanhcdn.com/media/product/250_62744_ban_phim_co_akko_3098b_plus_matcha_red_bean_4.jpg',
        images: [
            'data:image/jpeg;base64,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',
            'https://phucanhcdn.com/media/product/250_62744_ban_phim_co_akko_3098b_plus_matcha_red_bean_4.jpg',
        ],
        tags: ['khuyen-mai', 'sale', 'member'],
        category: 'Khuyến mãi',
        author: 'Admin Keyboard Store',
        isFeatured: false,
        isPublished: true,
    },
];

const seedArticlesCollections = async () => {
    const articleCount = await Article.countDocuments();
    if (articleCount === 0) {
        await Article.insertMany(articles);
    }
};

module.exports = {
    seedArticlesCollections,
};

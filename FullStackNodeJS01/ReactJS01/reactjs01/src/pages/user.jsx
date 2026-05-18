import { useEffect, useMemo, useState } from 'react';
import {
    createArticleApi,
    createKeyboardApi,
    createCategoryApi,
    deleteKeyboardApi,
    deleteCategoryApi,
    deleteArticleApi,
    getArticlesApi,
    getAdminOrdersApi,
    getKeyboardsApi,
    getCategoriesApi,
    getUserApi,
    updateArticleApi,
    updateKeyboardApi,
    updateCategoryApi,
} from '../util/api';
import { formatCurrency, getDiscountLabel } from '../util/format';

const emptyKeyboard = {
    title: '', slug: '', author: '', categoryId: '', description: '', price: '', oldPrice: '', discount: '', stock: '', sold: '', rating: '', reviewCount: '', imagesText: '', isFeatured: false, isNewest: false, isBestSeller: false, isPromotion: false,
};

const emptyCategory = { name: '', slug: '', description: '' };
const emptyArticle = {
    title: '',
    slug: '',
    category: '',
    author: '',
    summary: '',
    content: '',
    coverImage: '',
    imagesText: '',
    tagsText: '',
    isFeatured: false,
    isPublished: true,
};

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('books');
    const [keyboards, setKeyboards] = useState([]);
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [keyboardQuery, setKeyboardQuery] = useState('');
    const [categoryQuery, setCategoryQuery] = useState('');
    const [orderQuery, setOrderQuery] = useState('');
    const [orderDateFrom, setOrderDateFrom] = useState('');
    const [orderDateTo, setOrderDateTo] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [articleQuery, setArticleQuery] = useState('');
    const [keyboardForm, setKeyboardForm] = useState(emptyKeyboard);
    const [articleForm, setArticleForm] = useState(emptyArticle);
    const [categoryForm, setCategoryForm] = useState(emptyCategory);
    const [editingKeyboardId, setEditingKeyboardId] = useState('');
    const [editingArticleId, setEditingArticleId] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState('');

    const reloadData = async () => {
        const [keyboardsRes, articlesRes, categoriesRes, ordersRes, usersRes] = await Promise.all([
            getKeyboardsApi({ q: keyboardQuery || undefined }),
            getArticlesApi({ all: true }),
            getCategoriesApi(),
            getAdminOrdersApi(),
            getUserApi(),
        ]);
        setKeyboards(Array.isArray(keyboardsRes) ? keyboardsRes : []);
        setArticles(Array.isArray(articlesRes) ? articlesRes : []);
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
        setOrders(Array.isArray(ordersRes) ? ordersRes : []);
        setUsers(Array.isArray(usersRes) ? usersRes : []);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void reloadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredKeyboards = useMemo(() => keyboards.filter((keyboard) => `${keyboard.title} ${keyboard.author} ${keyboard.slug}`.toLowerCase().includes(keyboardQuery.toLowerCase())), [keyboards, keyboardQuery]);
    const filteredArticles = useMemo(() => articles.filter((article) => `${article.title} ${article.slug} ${article.category}`.toLowerCase().includes(articleQuery.toLowerCase())), [articles, articleQuery]);
    const filteredCategories = useMemo(() => categories.filter((category) => `${category.name} ${category.slug}`.toLowerCase().includes(categoryQuery.toLowerCase())), [categories, categoryQuery]);
    const filteredOrders = useMemo(() => orders.filter((order) => {
        const matchesQuery = `${order.userEmail} ${order.status}`.toLowerCase().includes(orderQuery.toLowerCase());

        if (!matchesQuery) {
            return false;
        }

        const createdAt = order.createdAt ? new Date(order.createdAt) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
            return true;
        }

        const normalizedDate = createdAt.toISOString().slice(0, 10);
        const matchesFrom = !orderDateFrom || normalizedDate >= orderDateFrom;
        const matchesTo = !orderDateTo || normalizedDate <= orderDateTo;

        return matchesFrom && matchesTo;
    }), [orders, orderDateFrom, orderDateTo, orderQuery]);
    const filteredUsers = useMemo(() => users.filter((user) => `${user.email} ${user.name} ${user.role}`.toLowerCase().includes(userQuery.toLowerCase())), [users, userQuery]);

    const onSubmitKeyboard = async (event) => {
        event.preventDefault();
        const payload = {
            title: keyboardForm.title,
            slug: keyboardForm.slug,
            author: keyboardForm.author,
            categoryId: keyboardForm.categoryId,
            description: keyboardForm.description,
            price: Number(keyboardForm.price || 0),
            oldPrice: Number(keyboardForm.oldPrice || 0),
            discount: Number(keyboardForm.discount || 0),
            stock: Number(keyboardForm.stock || 0),
            sold: Number(keyboardForm.sold || 0),
            rating: Number(keyboardForm.rating || 0),
            reviewCount: Number(keyboardForm.reviewCount || 0),
            images: keyboardForm.imagesText.split('\n').map((item) => item.trim()).filter(Boolean),
            isFeatured: Boolean(keyboardForm.isFeatured),
            isNewest: Boolean(keyboardForm.isNewest),
            isBestSeller: Boolean(keyboardForm.isBestSeller),
            isPromotion: Boolean(keyboardForm.isPromotion),
        };

        if (editingKeyboardId) {
            await updateKeyboardApi(editingKeyboardId, payload);
        } else {
            await createKeyboardApi(payload);
        }

        setKeyboardForm(emptyKeyboard);
        setEditingKeyboardId('');
        await reloadData();
    };

    const onEditKeyboard = (keyboard) => {
        setActiveTab('keyboards');
        setEditingKeyboardId(keyboard._id);
        setKeyboardForm({
            title: keyboard.title || '',
            slug: keyboard.slug || '',
            author: keyboard.author || '',
            categoryId: keyboard.categoryId?._id || keyboard.categoryId || '',
            description: keyboard.description || '',
            price: keyboard.price ?? '',
            oldPrice: keyboard.oldPrice ?? '',
            discount: keyboard.discount ?? '',
            stock: keyboard.stock ?? '',
            sold: keyboard.sold ?? '',
            rating: keyboard.rating ?? '',
            reviewCount: keyboard.reviewCount ?? '',
            imagesText: Array.isArray(keyboard.images) ? keyboard.images.join('\n') : '',
            isFeatured: Boolean(keyboard.isFeatured),
            isNewest: Boolean(keyboard.isNewest),
            isBestSeller: Boolean(keyboard.isBestSeller),
            isPromotion: Boolean(keyboard.isPromotion),
        });
    };

    const onDeleteKeyboard = async (id) => {
        await deleteKeyboardApi(id);
        await reloadData();
    };

    const onSubmitArticle = async (event) => {
        event.preventDefault();
        const payload = {
            title: articleForm.title,
            slug: articleForm.slug,
            category: articleForm.category,
            author: articleForm.author,
            summary: articleForm.summary,
            content: articleForm.content,
            coverImage: articleForm.coverImage,
            images: articleForm.imagesText.split('\n').map((item) => item.trim()).filter(Boolean),
            tags: articleForm.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
            isFeatured: Boolean(articleForm.isFeatured),
            isPublished: Boolean(articleForm.isPublished),
        };

        if (editingArticleId) {
            await updateArticleApi(editingArticleId, payload);
        } else {
            await createArticleApi(payload);
        }

        setArticleForm(emptyArticle);
        setEditingArticleId('');
        await reloadData();
    };

    const onEditArticle = (article) => {
        setActiveTab('articles');
        setEditingArticleId(article._id);
        setArticleForm({
            title: article.title || '',
            slug: article.slug || '',
            category: article.category || '',
            author: article.author || '',
            summary: article.summary || '',
            content: article.content || '',
            coverImage: article.coverImage || '',
            imagesText: Array.isArray(article.images) ? article.images.join('\n') : '',
            tagsText: Array.isArray(article.tags) ? article.tags.join(', ') : '',
            isFeatured: Boolean(article.isFeatured),
            isPublished: Boolean(article.isPublished),
        });
    };

    const onDeleteArticle = async (id) => {
        await deleteArticleApi(id);
        await reloadData();
    };

    const onSubmitCategory = async (event) => {
        event.preventDefault();
        if (editingCategoryId) {
            await updateCategoryApi(editingCategoryId, categoryForm);
        } else {
            await createCategoryApi(categoryForm);
        }
        setCategoryForm(emptyCategory);
        setEditingCategoryId('');
        await reloadData();
    };

    const onEditCategory = (category) => {
        setActiveTab('categories');
        setEditingCategoryId(category._id);
        setCategoryForm({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
        });
    };

    const tabs = [
        { key: 'keyboards', label: 'Bàn phím' },
        { key: 'articles', label: 'Bài viết' },
        { key: 'categories', label: 'Danh mục' },
        { key: 'orders', label: 'Đơn hàng' },
        { key: 'users', label: 'Thành viên' },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 lg:px-6">
            <div className="rounded-3xl bg-gradient-to-br from-red-600 to-red-400 p-8 text-white shadow-xl shadow-red-600/20">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-100">Admin workspace</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Quản trị Keyboard Store</h1>
                <p className="mt-4 max-w-3xl text-base text-white/90 md:text-lg">Tạo, sửa, xem, tìm kiếm bàn phím, danh mục, đơn hàng và thành viên ngay trong một khu vực quản trị duy nhất.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={activeTab === tab.key ? 'rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white' : 'rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100'}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'keyboards' && (
                <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
                    <form onSubmit={onSubmitKeyboard} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-slate-900">{editingKeyboardId ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}</h2>
                            {editingKeyboardId ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Đang sửa</span> : null}
                        </div>

                        <div className="mt-4 grid gap-3">
                            {['title', 'slug', 'author', 'price', 'oldPrice', 'discount', 'stock', 'sold', 'rating', 'reviewCount'].map((field) => (
                                <input
                                    key={field}
                                    value={keyboardForm[field]}
                                    onChange={(event) => setKeyboardForm((current) => ({ ...current, [field]: event.target.value }))}
                                    placeholder={field}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                                />
                            ))}
                            <select
                                value={keyboardForm.categoryId}
                                onChange={(event) => setKeyboardForm((current) => ({ ...current, categoryId: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map((category) => (
                                    <option key={category._id} value={category._id}>{category.name}</option>
                                ))}
                            </select>
                            <textarea
                                value={keyboardForm.description}
                                onChange={(event) => setKeyboardForm((current) => ({ ...current, description: event.target.value }))}
                                placeholder="description"
                                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            />
                            <textarea
                                value={keyboardForm.imagesText}
                                onChange={(event) => setKeyboardForm((current) => ({ ...current, imagesText: event.target.value }))}
                                placeholder="images, one URL per line"
                                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            />
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                                {['isFeatured', 'isNewest', 'isBestSeller', 'isPromotion'].map((field) => (
                                    <label key={field} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                                        <input type="checkbox" checked={Boolean(keyboardForm[field])} onChange={(event) => setKeyboardForm((current) => ({ ...current, [field]: event.target.checked }))} />
                                        {field}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                            <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Lưu sản phẩm</button>
                            <button type="button" onClick={() => { setKeyboardForm(emptyKeyboard); setEditingKeyboardId(''); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
                        </div>
                    </form>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-slate-900">Danh sách bàn phím</h2>
                            <input value={keyboardQuery} onChange={(event) => setKeyboardQuery(event.target.value)} placeholder="Tìm kiếm bàn phím" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
                        </div>

                        <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Bàn phím</th>
                                        <th className="px-4 py-3">Danh mục</th>
                                        <th className="px-4 py-3">Giá</th>
                                        <th className="px-4 py-3">Tồn</th>
                                        <th className="px-4 py-3">Bán</th>
                                        <th className="px-4 py-3">Tác vụ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredKeyboards.map((keyboard) => (
                                        <tr key={keyboard._id} className="border-t border-slate-200">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">{keyboard.title}</div>
                                                <div className="text-xs text-slate-500">{keyboard.author}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{keyboard.categoryId?.name || ''}</td>
                                            <td className="px-4 py-3 text-slate-700">{formatCurrency(keyboard.price)} <span className="text-xs text-slate-400">{keyboard.discount ? getDiscountLabel(keyboard.discount) : ''}</span></td>
                                            <td className="px-4 py-3 text-slate-700">{keyboard.stock}</td>
                                            <td className="px-4 py-3 text-slate-700">{keyboard.sold}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => onEditKeyboard(keyboard)} className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Sửa</button>
                                                    <button type="button" onClick={() => onDeleteKeyboard(keyboard._id)} className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'articles' && (
                <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
                    <form onSubmit={onSubmitArticle} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-slate-900">{editingArticleId ? 'Cập nhật bài viết' : 'Đăng bài viết'}</h2>
                            {editingArticleId ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Đang sửa</span> : null}
                        </div>

                        <div className="mt-4 grid gap-3">
                            {['title', 'slug', 'category', 'author', 'coverImage'].map((field) => (
                                <input
                                    key={field}
                                    value={articleForm[field]}
                                    onChange={(event) => setArticleForm((current) => ({ ...current, [field]: event.target.value }))}
                                    placeholder={field}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                                />
                            ))}
                            <textarea
                                value={articleForm.summary}
                                onChange={(event) => setArticleForm((current) => ({ ...current, summary: event.target.value }))}
                                placeholder="summary"
                                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            />
                            <textarea
                                value={articleForm.content}
                                onChange={(event) => setArticleForm((current) => ({ ...current, content: event.target.value }))}
                                placeholder="content"
                                className="min-h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            />
                            <textarea
                                value={articleForm.imagesText}
                                onChange={(event) => setArticleForm((current) => ({ ...current, imagesText: event.target.value }))}
                                placeholder="images, one URL per line"
                                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            />
                            <input
                                value={articleForm.tagsText}
                                onChange={(event) => setArticleForm((current) => ({ ...current, tagsText: event.target.value }))}
                                placeholder="tags, separated by comma"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            />
                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                                {['isFeatured', 'isPublished'].map((field) => (
                                    <label key={field} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                                        <input type="checkbox" checked={Boolean(articleForm[field])} onChange={(event) => setArticleForm((current) => ({ ...current, [field]: event.target.checked }))} />
                                        {field}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                            <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Lưu bài viết</button>
                            <button type="button" onClick={() => { setArticleForm(emptyArticle); setEditingArticleId(''); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
                        </div>
                    </form>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-slate-900">Danh sách bài viết</h2>
                            <input value={articleQuery} onChange={(event) => setArticleQuery(event.target.value)} placeholder="Tìm kiếm bài viết" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
                        </div>

                        <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Bài viết</th>
                                        <th className="px-4 py-3">Danh mục</th>
                                        <th className="px-4 py-3">Nổi bật</th>
                                        <th className="px-4 py-3">Ngày</th>
                                        <th className="px-4 py-3">Tác vụ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredArticles.map((article) => (
                                        <tr key={article._id} className="border-t border-slate-200">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-900">{article.title}</div>
                                                <div className="text-xs text-slate-500">{article.slug}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{article.category}</td>
                                            <td className="px-4 py-3 text-slate-700">{article.isFeatured ? 'Có' : 'Không'}</td>
                                            <td className="px-4 py-3 text-slate-500">{article.createdAt ? new Date(article.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => onEditArticle(article)} className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Sửa</button>
                                                    <button type="button" onClick={() => onDeleteArticle(article._id)} className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'categories' && (
                <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
                    <form onSubmit={onSubmitCategory} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900">{editingCategoryId ? 'Cập nhật danh mục' : 'Tạo danh mục'}</h2>
                        <div className="mt-4 grid gap-3">
                            {['name', 'slug'].map((field) => (
                                <input
                                    key={field}
                                    value={categoryForm[field]}
                                    onChange={(event) => setCategoryForm((current) => ({ ...current, [field]: event.target.value }))}
                                    placeholder={field}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                                />
                            ))}
                            <textarea
                                value={categoryForm.description}
                                onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                                placeholder="description"
                                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Lưu danh mục</button>
                            <button type="button" onClick={() => { setCategoryForm(emptyCategory); setEditingCategoryId(''); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
                        </div>
                    </form>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-slate-900">Danh sách danh mục</h2>
                            <input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Tìm kiếm danh mục" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCategories.map((category) => (
                                <div key={category._id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="font-semibold text-slate-900">{category.name}</div>
                                    <div className="text-sm text-slate-500">{category.slug}</div>
                                    <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button type="button" onClick={() => onEditCategory(category)} className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Sửa</button>
                                        <button type="button" onClick={async () => { await deleteCategoryApi(category._id); await reloadData(); }} className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">Xóa</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'orders' && (
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 xl:grid-cols-[1fr_320px] xl:items-end">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Đơn hàng</h2>
                            <p className="mt-1 text-sm text-slate-500">Lọc theo từ khóa hoặc khoảng ngày tạo đơn để tìm nhanh hơn.</p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-3">
                            <input value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Tìm kiếm đơn hàng" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
                            <input type="date" value={orderDateFrom} onChange={(event) => setOrderDateFrom(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
                            <input type="date" value={orderDateTo} onChange={(event) => setOrderDateTo(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
                        </div>
                    </div>
                    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Khách hàng</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Thanh toán</th>
                                    <th className="px-4 py-3">Tổng tiền</th>
                                    <th className="px-4 py-3">Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order._id} className="border-t border-slate-200">
                                        <td className="px-4 py-3">{order.userEmail}</td>
                                        <td className="px-4 py-3">{order.status}</td>
                                        <td className="px-4 py-3">{order.paymentMethod}</td>
                                        <td className="px-4 py-3">{formatCurrency(order.totalAmount)}</td>
                                        <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === 'users' && (
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-slate-900">Thành viên</h2>
                        <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Tìm kiếm thành viên" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
                    </div>
                    <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Họ tên</th>
                                    <th className="px-4 py-3">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user._id || user.email} className="border-t border-slate-200">
                                        <td className="px-4 py-3">{user.email}</td>
                                        <td className="px-4 py-3">{user.name}</td>
                                        <td className="px-4 py-3">{user.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
};

export default AdminPage;
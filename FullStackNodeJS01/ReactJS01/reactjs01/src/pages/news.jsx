import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArticlesApi } from '../util/api';

const NewsPage = () => {
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        const load = async () => {
            const res = await getArticlesApi({ latest: true });
            setArticles(Array.isArray(res) ? res : []);
        };

        load();
    }, []);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Tin tức cửa hàng</h1>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                    <Link key={article._id} to={`/news/${article._id}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                        <img src={article.coverImage} alt={article.title} className="aspect-[4/3] w-full object-cover" />
                        <div className="p-4">
                            <div className="text-xs uppercase tracking-wide text-slate-400">{article.category}</div>
                            <div className="mt-2 text-lg font-bold text-slate-900">{article.title}</div>
                            <p className="mt-2 line-clamp-3 text-sm text-slate-500">{article.summary}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default NewsPage;

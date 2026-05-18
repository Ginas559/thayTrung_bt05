import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArticleDetailApi } from '../util/api';

const NewsDetailPage = () => {
    const { id } = useParams();
    const [article, setArticle] = useState(null);

    useEffect(() => {
        const load = async () => {
            const res = await getArticleDetailApi(id);
            setArticle(res?.article || null);
        };

        load();
    }, [id]);

    if (!article) {
        return <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">Không tìm thấy bài viết.</div>;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
            <img src={article.coverImage} alt={article.title} className="h-80 w-full rounded-[32px] object-cover" />
            <div className="mt-6 text-sm uppercase tracking-[0.25em] text-red-600">{article.category}</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{article.title}</h1>
            <p className="mt-3 text-slate-500">{article.author}</p>
            <div className="prose prose-slate mt-6 max-w-none whitespace-pre-line">
                {article.content}
            </div>
        </div>
    );
};

export default NewsDetailPage;

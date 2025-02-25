// components/PostCard.jsx
import React from 'react';
import { toast } from 'react-hot-toast';

const PostCard = ({ post }) => {
    const { title, image, prompt, badge } = post;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(prompt)
            .then(() => {
                toast.success('프롬프트가 복사되었습니다!');
            })
            .catch(() => {
                toast.error('복사 중 오류가 발생했습니다.');
            });
    };

    // 배지 색상 결정
    const getBadgeColor = (type) => {
        switch(type) {
            case 'NEW': return 'badge-primary';
            case 'HOT': return 'badge-secondary';
            case 'POPULAR': return 'badge-accent';
            case 'FEATURED': return 'badge-info';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <figure className="relative">
                <img src={image} alt={title} className="w-full h-48 object-cover" />
                <div className="absolute top-2 left-2">
                    <div className={`badge ${getBadgeColor(badge)} badge-lg`}>{badge}</div>
                </div>
            </figure>
            <div className="card-body">
                <h2 className="card-title text-lg">{title}</h2>
                <p className="text-sm text-gray-500 line-clamp-2">{prompt}</p>
                <div className="card-actions justify-end mt-4">
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={copyToClipboard}
                    >
                        복사하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
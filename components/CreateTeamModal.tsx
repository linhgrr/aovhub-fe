import React, { useState } from 'react';
import { X, Users, Gamepad2 } from 'lucide-react';
import { CreateTeamInput, GameMode } from '../types';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: CreateTeamInput) => Promise<void>;
    isCreating: boolean;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    isCreating,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.RANKED);
    const [maxMembers, setMaxMembers] = useState(5);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (name.trim().length < 3) {
            newErrors.name = 'Tên phòng phải có ít nhất 3 ký tự';
        }
        if (name.length > 100) {
            newErrors.name = 'Tên phòng không được quá 100 ký tự';
        }
        if (description.trim().length < 10) {
            newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
        }
        if (description.length > 500) {
            newErrors.description = 'Mô tả không được quá 500 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        await onCreate({
            name: name.trim(),
            description: description.trim(),
            game_mode: gameMode,
            max_members: maxMembers,
        });
    };

    const gameModeOptions = [
        { value: GameMode.RANKED, label: 'Xếp hạng', description: 'Leo rank cùng team' },
        { value: GameMode.CASUAL, label: 'Thường', description: 'Chơi vui vẻ' },
        { value: GameMode.CUSTOM, label: 'Tùy chỉnh', description: 'Đấu nội bộ' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-800/95 backdrop-blur-md border border-slate-700/50 w-full max-w-md shadow-2xl rounded-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-b border-slate-700/50 p-5 flex items-center justify-between relative overflow-hidden rounded-t-xl">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-tl-xl"></div>
                    <h2 className="text-xl font-display font-bold text-white uppercase tracking-wide flex items-center gap-2 glow-text">
                        <Users className="w-5 h-5 text-primary" />
                        Tạo Phòng Mới
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Team Name */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                            Tên phòng *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VD: Leo rank Kim Cương tối nay"
                                className="w-full bg-slate-800/60 border-2 border-slate-700/50 text-white px-4 py-3 focus:border-primary focus:outline-none transition-colors rounded-lg placeholder-slate-500"
                                maxLength={100}
                            />
                            <div className="absolute right-3 bottom-3 text-xs text-slate-500 font-mono">{name.length}/100</div>
                        </div>
                        {errors.name && (
                            <p className="text-red-400 text-xs mt-1 font-bold">{errors.name}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                            Mô tả *
                        </label>
                        <div className="relative">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="VD: Cần 2 người đi mid và support, rank từ Kim Cương trở lên. Có mic, chơi chill."
                                rows={3}
                                className="w-full bg-slate-800/60 border-2 border-slate-700/50 text-white px-4 py-3 focus:border-primary focus:outline-none transition-colors resize-none rounded-lg placeholder-slate-500"
                                maxLength={500}
                            />
                            <div className="absolute right-3 bottom-3 text-xs text-slate-500 font-mono">{description.length}/500</div>
                        </div>
                        {errors.description && (
                            <p className="text-red-400 text-xs mt-1 font-bold">{errors.description}</p>
                        )}
                    </div>

                    {/* Game Mode */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                            <Gamepad2 className="w-4 h-4 inline mr-1" />
                            Chế độ chơi
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {gameModeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setGameMode(option.value)}
                                    className={`p-2 border-2 transition-all rounded-lg ${gameMode === option.value
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-primary/30 hover:text-white'
                                        }`}
                                >
                                    <div className="font-bold text-sm uppercase">{option.label}</div>
                                    <div className={`text-[10px] ${gameMode === option.value ? 'text-white/90' : 'text-slate-500'}`}>
                                        {option.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Max Members */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                            <Users className="w-4 h-4 inline mr-1" />
                            Số thành viên tối đa
                        </label>
                        <div className="flex gap-2">
                            {[2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setMaxMembers(num)}
                                    className={`flex-1 py-2 border-2 font-bold transition-all rounded-lg ${maxMembers === num
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-primary/30 hover:text-white'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="bg-primary/10 border-l-4 border-primary p-3 text-sm rounded-r-lg">
                        <p className="text-slate-400">
                            ⏱️ <span className="text-primary font-bold uppercase text-xs">Lưu ý:</span> Phòng sẽ tự động đóng sau <span className="text-white font-bold">1 tiếng</span>.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-bold py-3 uppercase tracking-wider rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 transition-all uppercase tracking-wider rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30"
                        >
                            {isCreating ? 'Đang tạo...' : 'Tạo phòng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

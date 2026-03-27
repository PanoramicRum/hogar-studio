"use client";

interface Room {
  id: string;
  name: string;
}

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoom: string;
  onSelect: (roomId: string) => void;
}

export function RoomSelector({ rooms, selectedRoom, onSelect }: RoomSelectorProps) {
  if (rooms.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Room</label>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onSelect("")}
          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
            !selectedRoom ? "ring-2 ring-[#6f5100] shadow-sm text-[#6f5100] font-semibold" : "surface-container-low hover:shadow-ambient text-muted-foreground"
          }`}
        >
          <span className="material-symbols-outlined mr-1" style={{ fontSize: "12px", verticalAlign: "middle" }}>home</span>
          Entire Apartment
        </button>
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              selectedRoom === room.id ? "ring-2 ring-[#6f5100] shadow-sm text-[#6f5100] font-semibold" : "surface-container-low hover:shadow-ambient text-muted-foreground"
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { FileText, Eye, Mail, Link2, User, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  url: string;
  type: string;
  name: string;
}

interface DocumentCardProps {
  doc: Document;
  bookingId: number;
  title: string;
  borderColor: string;
  isLoading?: boolean;
  onView: (url: string) => void;
  onSend: (bookingId: number, type: string, recipient: 'client' | 'driver') => void;
  onShare: (url: string) => void;
}

export function DocumentCard({
  doc,
  bookingId,
  title,
  borderColor,
  isLoading = false,
  onView,
  onSend,
  onShare,
}: DocumentCardProps) {
  const textColor = borderColor.replace('border-', 'text-');

  return (
    <div className={`relative border-l-4 ${borderColor} bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className={`h-5 w-5 ${textColor}`} />
          <h4 className="font-semibold text-[#0A0A0A]">{title}</h4>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(doc.url)}
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          Voir
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2 hover:bg-gray-50"
            >
              <Mail className="h-4 w-4" />
              Envoyer
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSend(bookingId, doc.type, 'client')}>
              <User className="h-4 w-4 mr-2" />
              Au client
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSend(bookingId, doc.type, 'driver')}>
              <Phone className="h-4 w-4 mr-2" />
              Au chauffeur
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => onShare(doc.url)}
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <Link2 className="h-4 w-4" />
          Copier
        </Button>
      </div>
    </div>
  );
}


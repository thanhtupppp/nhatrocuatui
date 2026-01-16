
import { Room, Tenant, SystemSettings } from '../types';

interface ContractData {
  tenant: Tenant;
  room: Room;
  settings: SystemSettings;
  contractDate?: string;
  contractDuration?: number;
  contractNumber?: string;
}

/**
 * Convert number to Vietnamese words
 * Chuyển số sang chữ tiếng Việt (chuẩn kế toán VN)
 */
const numberToVietnameseWords = (num: number): string => {
  if (num === 0) return 'Không đồng';
  
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
  
  const readThreeDigits = (n: number): string => {
    if (n === 0) return '';
    let result = '';
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;
    
    if (hundred > 0) {
      result += ones[hundred] + ' trăm ';
    }
    
    if (ten > 0) {
      if (ten === 1) {
        result += 'mười ';
      } else {
        result += tens[ten] + ' ';
      }
      if (one === 1) {
        result += 'mốt';
      } else if (one === 5 && ten > 0) {
        result += 'lăm';
      } else if (one > 0) {
        result += ones[one];
      }
    } else if (one > 0) {
      if (hundred > 0) result += 'lẻ ';
      result += ones[one];
    }
    
    return result.trim();
  };
  
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  let result = '';
  let unitIndex = 0;
  
  while (num > 0) {
    const threeDigits = num % 1000;
    if (threeDigits > 0) {
      const words = readThreeDigits(threeDigits);
      result = words + (units[unitIndex] ? ' ' + units[unitIndex] : '') + ' ' + result;
    }
    num = Math.floor(num / 1000);
    unitIndex++;
  }
  
  result = result.trim();
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
};

/**
 * Generate a Vietnamese standard rental contract
 * Following Nghị định 30/2020/NĐ-CP về công tác văn thư
 * 
 * Format standards:
 * - Font: Times New Roman (TCVN 6909:2001)
 * - Size: 13-14pt for body, 12-13pt for headers
 * - Margins: Top 20-25mm, Bottom 20-25mm, Left 30-35mm, Right 15-20mm
 * - Line spacing: 1-1.5 lines, paragraph spacing: 6pt minimum
 */
export const generateVietnameseContract = (data: ContractData): string => {
  const { tenant, room, settings, contractDate, contractDuration = 12, contractNumber } = data;
  
  // Use contractDate if provided, otherwise use now
  const contractDay = contractDate ? new Date(contractDate) : new Date();
  const day = contractDay.getDate();
  const month = contractDay.getMonth() + 1;
  const year = contractDay.getFullYear();
  
  const deposit = room.depositAmount || room.price;
  
  // Auto-generate contract number if not provided
  const autoContractNo = contractNumber || `${String(day).padStart(2, '0')}/${year}/HĐTP-${room.name.replace(/\s/g, '')}`;
  
  // Calculate dates
  const startDate = new Date(tenant.startDate || contractDay);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + contractDuration);
  
  const formatDate = (d: Date) => {
    return `ngày ${d.getDate().toString().padStart(2, '0')} tháng ${(d.getMonth() + 1).toString().padStart(2, '0')} năm ${d.getFullYear()}`;
  };
  
  const formatCurrency = (n: number) => n.toLocaleString('vi-VN');
  
  // Get location from settings or address
  const location = settings.landlordAddress?.split(',').pop()?.trim() || 'TP. Hồ Chí Minh';
  
  // Number to words for rent and deposit
  const rentInWords = numberToVietnameseWords(room.price);
  const depositInWords = numberToVietnameseWords(deposit);

  return `
                                                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                                           Độc lập - Tự do - Hạnh phúc
                                                          ─────────────────────────────


                                               HỢP ĐỒNG THUÊ PHÒNG TRỌ
                                                    Số: ${autoContractNo}


        Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;
        Căn cứ Luật Nhà ở số 27/2023/QH15 ngày 27/11/2023;
        Căn cứ nhu cầu và khả năng thực tế của hai bên;

        Hôm nay, ${formatDate(contractDay)}, tại địa chỉ: ${settings.landlordAddress || '[Địa chỉ nhà trọ]'}

        Chúng tôi gồm:

I. BÊN CHO THUÊ (BÊN A):

        Họ và tên:          ${settings.landlordName || settings.bankOwner || '[Tên chủ trọ]'}
        Số CCCD/CMND:       ${settings.landlordIdCard || '[Số CCCD]'}
        Điện thoại:         ${settings.landlordPhone || '[SĐT]'}
        Địa chỉ thường trú: ${settings.landlordAddress || '[Địa chỉ]'}

II. BÊN THUÊ (BÊN B):

        Họ và tên:          ${tenant.name}
        Số CCCD/CMND:       ${tenant.idCard}
        Ngày sinh:          ${tenant.dateOfBirth || '[Ngày sinh]'}
        Quê quán:           ${tenant.hometown}
        Điện thoại:         ${tenant.phone}
        Nghề nghiệp:        ${tenant.occupation || '[Nghề nghiệp]'}

        Hai bên cùng thống nhất ký kết hợp đồng thuê phòng trọ với các điều khoản sau đây:

                                                    Điều 1
                                          ĐỐI TƯỢNG CỦA HỢP ĐỒNG

        1.1. Bên A đồng ý cho Bên B thuê phòng số ${room.name}, loại phòng: ${room.type || 'Phòng đơn'}.
        1.2. Diện tích sử dụng: .......... m².
        1.3. Tình trạng phòng: ${room.description || 'Đầy đủ tiện nghi cơ bản'}.

                                                    Điều 2
                                               THỜI HẠN THUÊ

        2.1. Thời hạn thuê: ${contractDuration} (${contractDuration === 12 ? 'mười hai' : contractDuration}) tháng.
        2.2. Kể từ ${formatDate(startDate)} đến ${formatDate(endDate)}.
        2.3. Khi hết hạn hợp đồng, nếu Bên B có nhu cầu tiếp tục thuê và Bên A đồng ý, hai bên sẽ ký phụ lục gia hạn hợp đồng.

                                                    Điều 3
                                    GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN

        3.1. Giá thuê phòng: ${formatCurrency(room.price)} đồng/tháng
             (Bằng chữ: ${rentInWords}).

        3.2. Các khoản chi phí dịch vụ (tính theo thực tế sử dụng hàng tháng):
             a) Tiền điện:         ${formatCurrency(settings.electricityRate)} đồng/kWh
             b) Tiền nước:         ${formatCurrency(settings.waterRate)} đồng/m³
             c) Tiền Internet:     ${formatCurrency(settings.internetFee)} đồng/tháng
             d) Tiền rác:          ${formatCurrency(settings.trashFee)} đồng/tháng

        3.3. Tiền đặt cọc: ${formatCurrency(deposit)} đồng
             (Bằng chữ: ${depositInWords}).
             Tiền cọc được hoàn trả khi Bên B trả phòng đúng thời hạn, không vi phạm hợp đồng và thanh toán đầy đủ các khoản phí.

        3.4. Phương thức thanh toán:
             a) Thời gian: Thanh toán từ ngày 01 đến ngày 10 hàng tháng.
             b) Hình thức: Tiền mặt hoặc chuyển khoản.
             c) Thông tin chuyển khoản:
                - Số tài khoản: ${settings.bankAccount}
                - Chủ tài khoản: ${settings.bankOwner}
                - Ngân hàng: ${settings.bankId}

                                                    Điều 4
                                       QUYỀN VÀ NGHĨA VỤ CỦA BÊN A

        4.1. Bàn giao phòng đúng hiện trạng như đã thỏa thuận.
        4.2. Đảm bảo quyền sử dụng phòng hợp pháp, không bị tranh chấp.
        4.3. Thông báo trước ít nhất 30 (ba mươi) ngày khi có thay đổi giá thuê, điều khoản hoặc chấm dứt hợp đồng.
        4.4. Sửa chữa các hư hỏng không do lỗi của Bên B gây ra.
        4.5. Hoàn trả tiền cọc khi Bên B trả phòng đúng quy định.
        4.6. Cung cấp đầy đủ hóa đơn, biên lai thu tiền cho Bên B.

                                                    Điều 5
                                       QUYỀN VÀ NGHĨA VỤ CỦA BÊN B

        5.1. Thanh toán đầy đủ và đúng hạn tiền thuê phòng cùng các chi phí dịch vụ.
        5.2. Sử dụng phòng đúng mục đích, giữ gìn vệ sinh và bảo quản tài sản.
        5.3. Không tự ý sửa chữa, cải tạo, đục tường khi chưa có sự đồng ý bằng văn bản của Bên A.
        5.4. Không được cho thuê lại, chuyển nhượng hợp đồng cho bên thứ ba.
        5.5. Chấp hành nội quy nhà trọ và các quy định của pháp luật.
        5.6. Thông báo trước ít nhất 30 (ba mươi) ngày khi muốn trả phòng.
        5.7. Bàn giao phòng nguyên trạng khi kết thúc hợp đồng (trừ hao mòn tự nhiên).
        5.8. Tự chịu trách nhiệm về tài sản cá nhân và an toàn của bản thân.

                                                    Điều 6
                                              NỘI QUY NHÀ TRỌ

${settings.houseRules ? settings.houseRules.split('\n').map((line, i) => `        ${i + 1}. ${line.replace(/^\d+\.\s*/, '')}`).join('\n') : `        1. Giữ gìn vệ sinh chung, không xả rác bừa bãi.
        2. Không gây ồn ào sau 22h00 đến 06h00 sáng.
        3. Không nuôi vật nuôi (chó, mèo...) khi chưa có sự đồng ý của chủ trọ.
        4. Có trách nhiệm bảo quản tài sản chung của nhà trọ.
        5. Khách đến thăm/ở lại qua đêm phải đăng ký với chủ trọ.
        6. Không sử dụng, tàng trữ chất cấm, vũ khí trong phòng trọ.
        7. Tiết kiệm điện, nước; tắt các thiết bị điện khi ra khỏi phòng.
        8. Đậu xe đúng nơi quy định.`}

        Vi phạm nội quy nhà trọ tùy mức độ sẽ bị xử lý như sau:
        - Vi phạm lần 1: Nhắc nhở bằng văn bản.
        - Vi phạm lần 2: Phạt tiền 200.000 đồng.
        - Vi phạm từ lần 3: Bên A có quyền đơn phương chấm dứt hợp đồng theo Điều 7.3.

                                                    Điều 7
                                            CHẤM DỨT HỢP ĐỒNG

        7.1. Hợp đồng chấm dứt khi hết thời hạn thuê theo quy định tại Điều 2.
        7.2. Một trong hai bên muốn chấm dứt hợp đồng trước hạn phải thông báo bằng văn bản cho bên kia trước ít nhất 30 (ba mươi) ngày.
        7.3. Bên A có quyền đơn phương chấm dứt hợp đồng và yêu cầu Bên B bàn giao phòng trong thời hạn tối đa 07 (bảy) ngày trong các trường hợp:
             a) Vi phạm nghiêm trọng nội quy nhà trọ từ 03 (ba) lần trở lên;
             b) Sử dụng phòng vào mục đích trái pháp luật;
             c) Chậm thanh toán tiền phòng quá 30 (ba mươi) ngày;
             d) Có hành vi gây nguy hiểm đến người khác hoặc tài sản.
        7.4. Trường hợp Bên B chấm dứt hợp đồng trước hạn mà không thông báo đúng quy định, tiền cọc sẽ không được hoàn trả.

                                                    Điều 8
                                              BẤT KHẢ KHÁNG

        8.1. Sự kiện bất khả kháng là sự kiện xảy ra một cách khách quan, không thể lường trước được và không thể khắc phục được mặc dù đã áp dụng mọi biện pháp cần thiết và khả năng cho phép, bao gồm nhưng không giới hạn: thiên tai, hỏa hoạn, dịch bệnh, chiến tranh, quyết định của cơ quan nhà nước có thẩm quyền.
        8.2. Khi xảy ra sự kiện bất khả kháng, bên bị ảnh hưởng phải thông báo cho bên kia trong thời hạn 07 (bảy) ngày kể từ ngày xảy ra sự kiện.
        8.3. Trong thời gian xảy ra sự kiện bất khả kháng, các bên được miễn trách nhiệm thực hiện nghĩa vụ. Sau khi sự kiện bất khả kháng chấm dứt, hai bên tiếp tục thực hiện hợp đồng hoặc thỏa thuận chấm dứt hợp đồng.

                                                    Điều 9
                                       SỬA ĐỔI, BỔ SUNG HỢP ĐỒNG

        9.1. Mọi sửa đổi, bổ sung hợp đồng phải được lập thành văn bản, có chữ ký của cả hai bên và là một phần không tách rời của hợp đồng này.
        9.2. Các phụ lục hợp đồng (nếu có) có giá trị pháp lý như hợp đồng chính.

                                                    Điều 10
                                              ĐIỀU KHOẢN CHUNG

        10.1. Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản trong hợp đồng này.
        10.2. Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng, hòa giải. Nếu không thương lượng được, hai bên sẽ đưa ra Tòa án nhân dân có thẩm quyền giải quyết theo quy định của pháp luật.
        10.3. Hợp đồng có hiệu lực kể từ ngày ký.
        10.4. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản.

                                             ${location}, ${formatDate(contractDay)}

              BÊN A                                                                    BÊN B
       (Ký và ghi rõ họ tên)                                                    (Ký và ghi rõ họ tên)




      ${settings.landlordName || settings.bankOwner || '............................'}                                                      ${tenant.name}
`.trim();
};

export { numberToVietnameseWords };
export default generateVietnameseContract;

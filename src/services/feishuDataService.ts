import axios from 'axios';

class FeishuDataService {
  private baseUrl: string;
  private fundingAgentsCache: any;
  private fundingAgentsCacheExpiry: number | null;
  private cacheTimeout: number;

  constructor() {
    this.baseUrl = 'https://open.feishu.cn/open-apis';
    this.fundingAgentsCache = null;
    this.fundingAgentsCacheExpiry = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  // 获取配置
  getConfig() {
    return {
      fundingAgentsTableId: process.env.FEISHU_FUNDING_AGENTS_TABLE_ID || 'tblK4m7R8q6tRKOQ',
      fundingAgentsAppToken: process.env.FEISHU_FUNDING_AGENTS_APP_TOKEN || 'YWddbXTMgaefaXswVuNcyDiwn3Z',
      appId: process.env.FEISHU_APP_ID,
      appSecret: process.env.FEISHU_APP_SECRET
    };
  }

  // 处理飞书字段值，确保返回字符串
  processFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.processFieldValue(item)).join('\n');
    }
    
    // 如果是对象且包含text属性（富文本对象）
    if (typeof value === 'object' && value.text !== undefined) {
      return value.text;
    }
    
    // 其他情况直接转换为字符串
    return String(value);
  }

  // 处理飞书多选字段，返回逗号分隔的字符串
  processMultiSelectField(value: any): string {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      return value.map(item => typeof item === 'string' ? item.trim() : String(item)).filter(Boolean).join(',');
    }
    if (typeof value === 'string') return value;
    return String(value);
  }

  // 获取访问令牌
  async getAccessToken() {
    try {
      const config = this.getConfig();
      if (!config.appId || !config.appSecret) {
        throw new Error(`缺少飞书凭证: appId=${config.appId ? '已设置' : '未设置'}, appSecret=${config.appSecret ? '已设置' : '未设置'}`);
      }
      const response = await axios.post(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
        app_id: config.appId,
        app_secret: config.appSecret
      });
      if (response.data.code !== 0) {
        throw new Error(`飞书授权失败: ${response.data.msg || '未知错误'} (code: ${response.data.code})`);
      }
      if (!response.data.tenant_access_token) {
        throw new Error('飞书授权响应中缺少 tenant_access_token');
      }
      return response.data.tenant_access_token;
    } catch (error: any) {
      console.error('获取Access Token失败:', error.response?.data || error.message);
      throw error;
    }
  }

  // 获取特定表格的Funding Agent数据
  async getFundingAgentsByTable(tableId: string) {
    try {
      console.log(`🔄 获取表格 ${tableId} 的 Funding Agent 数据...`);
      const config = this.getConfig();
      const token = await this.getAccessToken();
      
      let allRecords: any[] = [];
      let pageToken: string | null = null;
      let hasMore = true;
      let pageCount = 0;
      
      while (hasMore) {
        pageCount++;
        const params: any = { page_size: 500 };
        if (pageToken) params.page_token = pageToken;
        
        const response = await axios.get(
          `${this.baseUrl}/bitable/v1/apps/${config.fundingAgentsAppToken}/tables/${tableId}/records`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: params
          }
        );
        
        if (response.data.code && response.data.code !== 0) {
          throw new Error(`飞书API错误: ${response.data.msg || '未知错误'}`);
        }
        
        const data = response.data.data;
        if (!data || !data.items) throw new Error('飞书API响应格式错误');
        
        allRecords = allRecords.concat(data.items);
        hasMore = data.has_more;
        pageToken = data.page_token;
      }
      
      return allRecords.map(record => {
        const fields = record.fields;
        const teaser = this.processFieldValue(fields["Teaser"]) || "";
        const teaserEN = this.processFieldValue(fields["Teaser-EN"]) || "";
        const projectName = this.processFieldValue(fields["Project"]) || "";
        const isFunding = this.processFieldValue(fields["正在融资"]) || "";
        
        const extractInfo = (text: string, pattern: RegExp) => {
          const match = text.match(pattern);
          return match ? match[1].trim() : "";
        };
        
        const projectNameFromTeaser = extractInfo(teaser, /项目名称[：:]\s*([^\n]+)/);
        const positioning = extractInfo(teaser, /项目定位[：:]\s*([^\n]+)/);
        const fundingInfo = extractInfo(teaser, /融资需求[：:]\s*([^\n]+)/);
        const address = extractInfo(teaser, /项目地址[：:]\s*([^\n]+)/);
        
        const positioningEN = extractInfo(teaserEN, /Project Positioning[：:]\s*([^\n]+)/i) || 
                             extractInfo(teaserEN, /Positioning[：:]\s*([^\n]+)/i) ||
                             extractInfo(teaserEN, /Description[：:]\s*([^\n]+)/i);
        
        const companyIntroMatch = teaser.match(/公司介绍\n([\s\S]*?)(?=\n\n|项目亮点|融资计划|$)/);
        const companyIntro = companyIntroMatch ? companyIntroMatch[1].trim() : "";
        
        const highlightsMatch = teaser.match(/项目亮点\n([\s\S]*?)(?=\n\n|融资计划|$)/);
        const highlights = highlightsMatch ? highlightsMatch[1].trim() : "";
        
        const fundingPlanMatch = teaser.match(/融资计划\n([\s\S]*?)(?=\n\n|$)/);
        const fundingPlan = fundingPlanMatch ? fundingPlanMatch[1].trim() : "";
        
        const companyIntroENMatch = teaserEN.match(/Company Introduction\n([\s\S]*?)(?=\n\n|Project Highlights|Funding Plan|$)/i);
        const companyIntroEN = companyIntroENMatch ? companyIntroENMatch[1].trim() : "";
        
        const highlightsENMatch = teaserEN.match(/Project Highlights\n([\s\S]*?)(?=\n\n|Funding Plan|$)/i);
        const highlightsEN = highlightsENMatch ? highlightsENMatch[1].trim() : "";
        
        const fundingPlanENMatch = teaserEN.match(/Funding Plan\n([\s\S]*?)(?=\n\n|$)/i);
        const fundingPlanEN = fundingPlanENMatch ? fundingPlanENMatch[1].trim() : "";
        
        const fundingStage = fundingInfo.match(/([A-Za-z-]+轮)/)?.[1] || "";
        
        let fundingAmount = "";
        if (fundingInfo) {
          const stageMatch = fundingInfo.match(/([A-Za-z-]+轮)/);
          if (stageMatch) {
            const stageIndex = fundingInfo.indexOf(stageMatch[1]);
            const afterStage = fundingInfo.substring(stageIndex + stageMatch[1].length);
            fundingAmount = afterStage.replace(/^[，,、\s]+/, '').trim();
          } else {
            fundingAmount = fundingInfo.trim();
          }
        }
        
        if (!fundingInfo && !fundingAmount) {
          const fullFundingInfo = this.processFieldValue(fields["融资需求"]) || "";
          if (fullFundingInfo) fundingAmount = fullFundingInfo;
        }
        
        const number = parseInt(this.processFieldValue(fields["编号"]) || "0");
        const score = Math.min(5, Math.max(1, (number / 20) * 5)).toFixed(1);
        
        const tags = this.processMultiSelectField(fields["标签"]);
        
        return {
          id: record.record_id,
          "名称": projectName || projectNameFromTeaser,
          "描述": positioning,
          "描述-EN": positioningEN,
          "Teaser-EN": teaserEN,
          "类型": "AI项目",
          "状态": isFunding === "是" ? "正在融资" : "已结束",
          "联系方式": this.processFieldValue(fields["BP链接"]?.text || ""),
          "地区": address,
          "投资阶段": fundingStage,
          "投资金额": fundingAmount || fundingInfo || "待确定",
          "成功率": "待评估",
          "评分": score,
          "标签": tags,
          "备注": teaser.substring(0, 200) + (teaser.length > 200 ? "..." : ""),
          "创建时间": fields["群发通知日期"] ? new Date(fields["群发通知日期"]).toLocaleDateString() : "",
          "更新时间": fields["群发通知日期"] ? new Date(fields["群发通知日期"]).toLocaleDateString() : "",
          "公司介绍": companyIntro,
          "项目亮点": highlights,
          "融资计划": fundingPlan,
          "完整融资信息": fundingInfo,
          "原始Teaser": teaser,
          "公司介绍-EN": companyIntroEN,
          "项目亮点-EN": highlightsEN,
          "融资计划-EN": fundingPlanEN,
          "sourceTableId": tableId // 新增字段，用于区分来源
        };
      });
    } catch (error: any) {
      console.error(`获取表格 ${tableId} 数据失败:`, error.response?.data || error.message);
      throw error;
    }
  }

  // 获取所有Funding Agent数据 (合并多个表格)
  async getAllFundingAgents() {
    try {
      const now = Date.now();
      if (this.fundingAgentsCache && this.fundingAgentsCacheExpiry && now < this.fundingAgentsCacheExpiry) {
        console.log('📦 使用Funding Agent数据缓存');
        return this.fundingAgentsCache;
      }
      
      const config = this.getConfig();
      const tableIds = [
        config.fundingAgentsTableId,
        'tblbYjT2XBIhU11g' // 新增表格ID
      ].filter(Boolean);
      
      console.log('🔄 开始从多个表格获取 Funding Agent 数据...');
      const results = await Promise.allSettled(tableIds.map(id => this.getFundingAgentsByTable(id)));
      const successfulResults = results.filter(
        (result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled'
      );
      const failedResults = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      );

      failedResults.forEach((result) => {
        console.error('Funding Agent表格拉取失败，已跳过该表:', result.reason?.message || result.reason);
      });

      if (successfulResults.length === 0) {
        throw new Error('所有Funding Agent数据表拉取失败');
      }

      const fundingAgents = successfulResults
        .flatMap(result => result.value)
        .filter((agent, index, arr) => arr.findIndex(item => item.id === agent.id) === index);
      
      this.fundingAgentsCache = fundingAgents;
      this.fundingAgentsCacheExpiry = now + this.cacheTimeout;
      
      console.log(`✅ 成功获取并合并${fundingAgents.length}条 Funding Agent 数据`);
      return fundingAgents;
    } catch (error: any) {
      console.error('获取所有 Funding Agent 数据失败:', error.message);
      throw error;
    }
  }

  // 清除Funding Agent缓存
  clearFundingAgentsCache() {
    this.fundingAgentsCache = null;
    this.fundingAgentsCacheExpiry = null;
    console.log('🗑️ Funding Agent数据缓存已清除');
  }

  // 测试连接
  async testConnection() {
    try {
      console.log('🔍 测试飞书API连接...');
      const config = this.getConfig();
      
      // 检查环境变量
      const missingVars = [];
      if (!config.appId) missingVars.push('FEISHU_APP_ID');
      if (!config.appSecret) missingVars.push('FEISHU_APP_SECRET');
      
      if (missingVars.length > 0) {
        return {
          success: false,
          error: `缺少环境变量: ${missingVars.join(', ')}`
        };
      }
      
      // 测试获取访问令牌
      const token = await this.getAccessToken();
      if (!token) {
        return {
          success: false,
          error: '无法获取访问令牌'
        };
      }
      
      return {
        success: true,
        message: '飞书API连接正常',
        data: {
          fundingAgentsAppToken: config.fundingAgentsAppToken,
          fundingAgentsTableId: config.fundingAgentsTableId
        }
      };
    } catch (error: any) {
      console.error('测试连接失败:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message
      };
    }
  }
}

export default FeishuDataService;

resource "aws_subnet" "public_subnet" {
  vpc_id     = aws_vpc.eks-vpc.id
  count                   = var.pub-sub-count
  cidr_block              = element(var.pub-cidr-block, count.index)
  availability_zone       = element(var.pub-az, count.index)
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.pub-sub-name}-${count.index + 1}"
    "kubernetes.io/cluster/${local.cluster-name}" = "owned"
    "kubernetes.io/role/elb"                      = "1"
  }
}

resource "aws_subnet" "private_subnet" {
  vpc_id     = aws_vpc.eks-vpc.id
  count                   = var.pri-sub-count
  cidr_block              = element(var.pri-cidr-block, count.index)
  availability_zone       = element(var.pri-az, count.index)
  map_public_ip_on_launch = false
  
  tags = {
    Name = "${var.pri-sub-name}-${count.index + 1}"
    "kubernetes.io/cluster/${local.cluster-name}" = "owned"
  }
}